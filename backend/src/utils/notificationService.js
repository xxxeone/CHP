/**
 * CHP Notification Service
 * Handles push notifications, SMS, and in-app notifications
 */
const db = require('../config/db');

class NotificationService {

  /**
   * Save notification to DB + send push if token available
   */
  static async send(userId, { title_zh, title_en, body_zh, body_en, type, reference_id }) {
    try {
      await db.query(`
        INSERT INTO notifications
          (user_id, title_zh, title_en, body_zh, body_en, type, reference_id, sent_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [userId, title_zh, title_en, body_zh, body_en, type, reference_id]);

      // Send push notification via Firebase
      const { rows: [user] } = await db.query(
        'SELECT push_token, preferred_lang FROM users WHERE id = $1', [userId]
      );
      if (user?.push_token) {
        await NotificationService.sendPush(user.push_token, {
          title: user.preferred_lang === 'zh' ? title_zh : title_en,
          body:  user.preferred_lang === 'zh' ? body_zh  : body_en,
        });
      }
    } catch (err) {
      console.error('Notification send error:', err);
    }
  }

  static async sendPush(token, { title, body }) {
    // Firebase Cloud Messaging integration
    // In production: use firebase-admin SDK
    console.log(`[PUSH] To: ${token.substring(0,10)}... | ${title}: ${body}`);
  }

  // ── Appointment notifications ─────────────────────────────

  static async sendAppointmentConfirmation(user, appointment) {
    const dateStr = new Date(appointment.appointment_date).toLocaleDateString('zh-CN');
    await NotificationService.send(user.id, {
      title_zh: '预约已确认',
      title_en: 'Appointment Confirmed',
      body_zh:  `您的预约已确认：${dateStr} ${appointment.appointment_time}，请准时到店。`,
      body_en:  `Your appointment is confirmed: ${dateStr} at ${appointment.appointment_time}. See you then!`,
      type:     'appointment_confirmed',
      reference_id: appointment.id,
    });
  }

  static async sendAppointmentReminder(user, appointment) {
    await NotificationService.send(user.id, {
      title_zh: '预约提醒',
      title_en: 'Appointment Reminder',
      body_zh:  `明天 ${appointment.appointment_time} 您有一个预约，请准时到店。`,
      body_en:  `Reminder: You have an appointment tomorrow at ${appointment.appointment_time}.`,
      type:     'appointment_reminder',
      reference_id: appointment.id,
    });
  }

  // ── Service reminders (cron) ──────────────────────────────

  static async sendServiceReminders() {
    // Find vehicles due for service (every 10,000km or 6 months)
    const { rows: vehicles } = await db.query(`
      SELECT v.*, u.id AS user_id, u.first_name, u.preferred_lang,
             sr.service_date AS last_service_date
      FROM vehicles v
      JOIN users u ON u.id = v.user_id
      LEFT JOIN (
        SELECT vehicle_id, MAX(service_date) AS service_date
        FROM service_records GROUP BY vehicle_id
      ) sr ON sr.vehicle_id = v.id
      WHERE u.is_active = true
        AND (
          (v.mileage - COALESCE(v.last_service_mileage, 0)) >= 9000
          OR sr.service_date < NOW() - INTERVAL '5 months'
        )
    `);

    for (const vehicle of vehicles) {
      await NotificationService.send(vehicle.user_id, {
        title_zh: '保养提醒',
        title_en: 'Service Reminder',
        body_zh:  `您的${vehicle.make} ${vehicle.model}（${vehicle.year}）即将到保养时间，立即预约享优先服务！`,
        body_en:  `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is due for service. Book now!`,
        type:     'service_reminder',
        reference_id: vehicle.id,
      });
    }

    return { reminders_sent: vehicles.length };
  }

  // ── Birthday notifications (cron: runs daily) ─────────────

  static async sendBirthdayMessages() {
    const { rows: users } = await db.query(`
      SELECT id, first_name, preferred_lang
      FROM users
      WHERE is_active = true
        AND date_of_birth IS NOT NULL
        AND TO_CHAR(date_of_birth, 'MM-DD') = TO_CHAR(NOW(), 'MM-DD')
    `);

    const PointsEngine = require('./pointsEngine');
    for (const user of users) {
      await PointsEngine.awardBirthdayBonus(user.id);
      await NotificationService.send(user.id, {
        title_zh: '生日快乐！🎂',
        title_en: 'Happy Birthday! 🎂',
        body_zh:  `${user.first_name}，生日快乐！CHP赠送您专属生日积分，今天来享受专属优惠吧！`,
        body_en:  `Happy Birthday ${user.first_name}! We've added birthday bonus points to your account. Enjoy!`,
        type:     'birthday',
        reference_id: null,
      });
    }

    return { birthday_messages_sent: users.length };
  }

  // ── Points earned notification ─────────────────────────────

  static async sendPointsEarned(userId, pointsEarned, newBalance) {
    await NotificationService.send(userId, {
      title_zh: `获得 ${pointsEarned} 积分`,
      title_en: `${pointsEarned} Points Earned`,
      body_zh:  `恭喜！您获得了 ${pointsEarned} 积分，当前余额：${newBalance} 积分。`,
      body_en:  `Congrats! You earned ${pointsEarned} points. Current balance: ${newBalance}.`,
      type:     'points_earned',
      reference_id: null,
    });
  }

  // ── Tier upgrade notification ──────────────────────────────

  static async sendTierUpgrade(userId, oldTier, newTier) {
    const tierNames = { bronze: '铜牌', silver: '银牌', gold: '金牌', platinum: '铂金' };
    await NotificationService.send(userId, {
      title_zh: `恭喜升级为${tierNames[newTier]}会员！`,
      title_en: `Congratulations! You've reached ${newTier} tier!`,
      body_zh:  `您已从${tierNames[oldTier]}升级为${tierNames[newTier]}会员，享受更多专属权益！`,
      body_en:  `You've upgraded from ${oldTier} to ${newTier} membership. Enjoy your new benefits!`,
      type:     'tier_upgrade',
      reference_id: null,
    });
  }
}

module.exports = NotificationService;
