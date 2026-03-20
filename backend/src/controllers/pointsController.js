const db = require('../config/db');
const PointsEngine = require('../utils/pointsEngine');

// GET /api/points/summary
exports.getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows: [summary] } = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN points > 0 THEN points ELSE 0 END), 0) AS total_earned,
        COALESCE(SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END), 0) AS total_redeemed,
        COALESCE(SUM(points), 0) AS current_balance
      FROM loyalty_points
      WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId]);

    const { rows: [user] } = await db.query(
      'SELECT membership_tier FROM users WHERE id = $1', [userId]
    );

    const { rows: tiers } = await db.query(
      'SELECT * FROM membership_tiers ORDER BY min_points'
    );

    const currentTier = tiers.find(t => t.tier === user.membership_tier);
    const tierIndex   = tiers.findIndex(t => t.tier === user.membership_tier);
    const nextTier    = tiers[tierIndex + 1] || null;

    const balance = parseInt(summary.current_balance);
    const progress = nextTier
      ? Math.min(100, Math.round(
          ((balance - currentTier.min_points) /
           (nextTier.min_points - currentTier.min_points)) * 100
        ))
      : 100;

    const pointsToNextTier = nextTier
      ? Math.max(0, nextTier.min_points - balance)
      : 0;

    // Check if user checked in today
    const { rows: [checkin] } = await db.query(`
      SELECT 1 FROM loyalty_points
      WHERE user_id = $1
        AND transaction_type = 'earn_checkin'
        AND DATE(created_at) = CURRENT_DATE
    `, [userId]);

    res.json({
      current_balance:   balance,
      total_earned:      parseInt(summary.total_earned),
      total_redeemed:    parseInt(summary.total_redeemed),
      membership_tier:   user.membership_tier,
      tier_name_zh:      currentTier.name_zh,
      tier_name_en:      currentTier.name_en,
      tier_color:        currentTier.color,
      points_per_dollar: parseFloat(currentTier.points_per_dollar),
      discount_percent:  parseFloat(currentTier.discount_percent),
      tier_progress:     progress,
      points_to_next_tier: pointsToNextTier,
      next_tier:         nextTier ? {
        tier:     nextTier.tier,
        name_zh:  nextTier.name_zh,
        name_en:  nextTier.name_en,
        color:    nextTier.color,
      } : null,
      checked_in_today: !!checkin,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/points/history
exports.getHistory = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, transaction_type, points, balance_after,
             description_zh, description_en, expires_at, created_at
      FROM loyalty_points
      WHERE user_id = $1
    `;
    const params = [req.user.id];

    if (type) {
      params.push(type);
      query += ` AND transaction_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    const { rows: [{ count }] } = await db.query(
      'SELECT COUNT(*) FROM loyalty_points WHERE user_id = $1', [req.user.id]
    );

    res.json({
      data: rows,
      pagination: { page: +page, limit: +limit, total: +count, pages: Math.ceil(count / limit) }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/points/expiring
exports.getExpiring = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT points, expires_at, description_zh, description_en
      FROM loyalty_points
      WHERE user_id = $1
        AND points > 0
        AND expires_at IS NOT NULL
        AND expires_at > NOW()
        AND expires_at < NOW() + INTERVAL '30 days'
      ORDER BY expires_at ASC
    `, [req.user.id]);

    const total = rows.reduce((sum, r) => sum + r.points, 0);
    res.json({ expiring_points: total, transactions: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/points/rewards
exports.getRewards = async (req, res, next) => {
  try {
    // Static rewards catalog – move to DB table in production
    const rewards = [
      { id: 'r1', name_zh: '$10折扣券',      name_en: '$10 Discount Voucher',   points: 500,  value: 10,  type: 'discount' },
      { id: 'r2', name_zh: '$25折扣券',      name_en: '$25 Discount Voucher',   points: 1200, value: 25,  type: 'discount' },
      { id: 'r3', name_zh: '$50折扣券',      name_en: '$50 Discount Voucher',   points: 2200, value: 50,  type: 'discount' },
      { id: 'r4', name_zh: '免费全车检查',   name_en: 'Free Full Inspection',   points: 800,  value: 0,   type: 'free_service', service: 'inspection' },
      { id: 'r5', name_zh: '免费机油更换',   name_en: 'Free Oil Change',        points: 1800, value: 0,   type: 'free_service', service: 'oil_change' },
      { id: 'r6', name_zh: '免费四轮定位',   name_en: 'Free Wheel Alignment',   points: 2000, value: 0,   type: 'free_service', service: 'alignment' },
    ];

    const { rows: [{ balance }] } = await db.query(
      'SELECT COALESCE(SUM(points),0) AS balance FROM loyalty_points WHERE user_id = $1', [req.user.id]
    );

    res.json({
      current_balance: parseInt(balance),
      rewards: rewards.map(r => ({ ...r, can_redeem: parseInt(balance) >= r.points }))
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/points/redeem
exports.redeem = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { reward_id, points_to_use } = req.body;
    const userId = req.user.id;

    const { rows: [{ balance }] } = await client.query(
      'SELECT COALESCE(SUM(points),0) AS balance FROM loyalty_points WHERE user_id = $1', [userId]
    );

    if (parseInt(balance) < points_to_use)
      return res.status(400).json({ error: '积分余额不足 / Insufficient points' });

    const newBalance = parseInt(balance) - points_to_use;

    await client.query(`
      INSERT INTO loyalty_points
        (user_id, transaction_type, points, balance_after, description_zh, description_en, reference_type)
      VALUES ($1, 'redeem_discount', $2, $3, '积分兑换奖励', 'Points redeemed for reward', 'reward')
    `, [userId, -points_to_use, newBalance]);

    await client.query('COMMIT');

    // TODO: generate voucher / coupon code
    const voucherCode = `CHP${Date.now().toString(36).toUpperCase()}`;
    res.json({
      message: '兑换成功 / Redemption successful',
      voucher_code: voucherCode,
      points_used: points_to_use,
      new_balance: newBalance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /api/points/checkin
exports.dailyCheckin = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const userId = req.user.id;

    const { rows: [existing] } = await client.query(`
      SELECT 1 FROM loyalty_points
      WHERE user_id = $1 AND transaction_type = 'earn_checkin'
        AND DATE(created_at) = CURRENT_DATE
    `, [userId]);

    if (existing)
      return res.status(409).json({ error: '今日已签到 / Already checked in today' });

    // Consecutive check-in bonus
    const { rows: [{ streak }] } = await client.query(`
      SELECT COUNT(*) AS streak FROM loyalty_points
      WHERE user_id = $1 AND transaction_type = 'earn_checkin'
        AND created_at >= NOW() - INTERVAL '7 days'
    `, [userId]);

    const basePoints = 10;
    const bonus = Math.min(parseInt(streak), 6) * 5;  // up to +30 bonus
    const totalPoints = basePoints + bonus;

    const { rows: [{ balance }] } = await client.query(
      'SELECT COALESCE(SUM(points),0) AS balance FROM loyalty_points WHERE user_id = $1', [userId]
    );

    await client.query(`
      INSERT INTO loyalty_points
        (user_id, transaction_type, points, balance_after, description_zh, description_en)
      VALUES ($1, 'earn_checkin', $2, $3, $4, $5)
    `, [
      userId, totalPoints,
      parseInt(balance) + totalPoints,
      `每日签到${bonus > 0 ? `（连续签到奖励+${bonus}）` : ''}`,
      `Daily check-in${bonus > 0 ? ` (streak bonus +${bonus})` : ''}`
    ]);

    await client.query('COMMIT');

    res.json({
      points_earned: totalPoints,
      streak: parseInt(streak) + 1,
      new_balance: parseInt(balance) + totalPoints,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// GET /api/points/tiers
exports.getTiers = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM membership_tiers ORDER BY min_points');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/points/earn-from-service  [Admin]
exports.earnFromService = async (req, res, next) => {
  try {
    const { user_id, record_id, amount } = req.body;
    const result = await PointsEngine.awardServicePoints(user_id, record_id, amount);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/points/adjust  [Admin]
exports.adminAdjust = async (req, res, next) => {
  try {
    const { user_id, points, reason } = req.body;
    const result = await PointsEngine.manualAdjust(user_id, points, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
