/**
 * CHP Loyalty Points Engine
 * Handles all points calculations and awards
 */
const db = require('../config/db');

class PointsEngine {

  /**
   * Get current points balance for a user
   */
  static async getBalance(userId, client = db) {
    const { rows: [{ balance }] } = await client.query(
      `SELECT COALESCE(SUM(points), 0) AS balance
       FROM loyalty_points
       WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );
    return parseInt(balance);
  }

  /**
   * Get points multiplier based on membership tier
   */
  static async getMultiplier(userId, client = db) {
    const { rows: [tier] } = await client.query(`
      SELECT mt.points_per_dollar
      FROM users u
      JOIN membership_tiers mt ON mt.tier = u.membership_tier
      WHERE u.id = $1
    `, [userId]);
    return parseFloat(tier?.points_per_dollar || 1.0);
  }

  /**
   * Award points after a service (1 point per $1 × tier multiplier)
   * Points expire in 2 years
   */
  static async awardServicePoints(userId, recordId, amountPaid, clientArg = null) {
    const useClient = clientArg || await db.getClient();
    const shouldRelease = !clientArg;
    try {
      if (!clientArg) await useClient.query('BEGIN');

      const multiplier = await PointsEngine.getMultiplier(userId, useClient);
      const pointsToAward = Math.floor(amountPaid * multiplier);
      const currentBalance = await PointsEngine.getBalance(userId, useClient);
      const newBalance = currentBalance + pointsToAward;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 2);

      await useClient.query(`
        INSERT INTO loyalty_points
          (user_id, transaction_type, points, balance_after,
           reference_id, reference_type,
           description_zh, description_en, expires_at)
        VALUES ($1, 'earn_service', $2, $3, $4, 'service_record',
                '消费获得积分 (×' || $5 || ')', 'Points earned from service (×' || $5 || ')',
                $6)
      `, [userId, pointsToAward, newBalance, recordId, multiplier, expiresAt]);

      // Update service record with points earned
      await useClient.query(
        'UPDATE service_records SET points_earned = $1 WHERE id = $2',
        [pointsToAward, recordId]
      );

      if (!clientArg) await useClient.query('COMMIT');

      return { points_awarded: pointsToAward, new_balance: newBalance, multiplier };
    } catch (err) {
      if (!clientArg) await useClient.query('ROLLBACK');
      throw err;
    } finally {
      if (shouldRelease) useClient.release();
    }
  }

  /**
   * Award birthday bonus points (once per year)
   */
  static async awardBirthdayBonus(userId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Check if birthday bonus already given this year
      const { rows: [existing] } = await client.query(`
        SELECT 1 FROM loyalty_points
        WHERE user_id = $1
          AND transaction_type = 'earn_birthday'
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      `, [userId]);

      if (existing) return null;

      const { rows: [tierData] } = await client.query(`
        SELECT mt.birthday_bonus
        FROM users u JOIN membership_tiers mt ON mt.tier = u.membership_tier
        WHERE u.id = $1
      `, [userId]);

      const bonusPoints = tierData?.birthday_bonus || 100;
      const currentBalance = await PointsEngine.getBalance(userId, client);
      const newBalance = currentBalance + bonusPoints;

      await client.query(`
        INSERT INTO loyalty_points
          (user_id, transaction_type, points, balance_after, description_zh, description_en)
        VALUES ($1, 'earn_birthday', $2, $3, '生日专属积分奖励', 'Birthday bonus points')
      `, [userId, bonusPoints, newBalance]);

      await client.query('COMMIT');
      return { points_awarded: bonusPoints, new_balance: newBalance };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Award review points (50 points per review)
   */
  static async awardReviewPoints(userId, reviewId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const currentBalance = await PointsEngine.getBalance(userId, client);
      const pointsToAward = 50;
      const newBalance = currentBalance + pointsToAward;

      await client.query(`
        INSERT INTO loyalty_points
          (user_id, transaction_type, points, balance_after,
           reference_id, reference_type, description_zh, description_en)
        VALUES ($1, 'earn_review', $2, $3, $4, 'review',
                '提交评价获得积分', 'Points earned for submitting review')
      `, [userId, pointsToAward, newBalance, reviewId]);

      await client.query(
        'UPDATE reviews SET points_awarded = $1 WHERE id = $2',
        [pointsToAward, reviewId]
      );

      await client.query('COMMIT');
      return { points_awarded: pointsToAward, new_balance: newBalance };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Manually adjust points (admin use)
   */
  static async manualAdjust(userId, points, reason) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const currentBalance = await PointsEngine.getBalance(userId, client);
      const newBalance = currentBalance + points;

      if (newBalance < 0)
        throw Object.assign(new Error('积分余额不足 / Insufficient points'), { status: 400 });

      await client.query(`
        INSERT INTO loyalty_points
          (user_id, transaction_type, points, balance_after, description_zh, description_en)
        VALUES ($1, 'adjust_manual', $2, $3, $4, $4)
      `, [userId, points, newBalance, reason]);

      await client.query('COMMIT');
      return { points_adjusted: points, new_balance: newBalance };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Expire old points (cron job: runs daily)
   */
  static async expirePoints() {
    const client = await db.getClient();
    try {
      const { rows: expiring } = await client.query(`
        SELECT user_id, SUM(points) AS total
        FROM loyalty_points
        WHERE expires_at < NOW() AND points > 0
          AND NOT EXISTS (
            SELECT 1 FROM loyalty_points lp2
            WHERE lp2.reference_id = loyalty_points.id
              AND lp2.transaction_type = 'expire'
          )
        GROUP BY user_id
      `);

      for (const { user_id, total } of expiring) {
        const currentBalance = await PointsEngine.getBalance(user_id, client);
        const expired = Math.min(parseInt(total), currentBalance);
        if (expired <= 0) continue;

        await client.query(`
          INSERT INTO loyalty_points
            (user_id, transaction_type, points, balance_after, description_zh, description_en)
          VALUES ($1, 'expire', $2, $3, '积分已过期', 'Points expired')
        `, [user_id, -expired, currentBalance - expired]);
      }

      return { expired_users: expiring.length };
    } finally {
      client.release();
    }
  }
}

module.exports = PointsEngine;
