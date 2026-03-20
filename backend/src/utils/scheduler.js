/**
 * CHP Scheduled Jobs (cron)
 * Run with: node src/utils/scheduler.js
 */
const cron = require('node-cron');
const NotificationService = require('./notificationService');
const PointsEngine = require('./pointsEngine');
const db = require('../config/db');

console.log('CHP Scheduler started');

// ── Every day at 08:00 – send appointment reminders for tomorrow ──
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Sending appointment reminders...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { rows: appointments } = await db.query(`
      SELECT a.*, u.id AS uid, u.first_name, u.preferred_lang
      FROM appointments a
      JOIN users u ON u.id = a.user_id
      WHERE a.appointment_date = $1
        AND a.status IN ('pending','confirmed')
        AND a.reminder_sent = false
    `, [tomorrowStr]);

    for (const appt of appointments) {
      await NotificationService.sendAppointmentReminder({ id: appt.uid, ...appt }, appt);
      await db.query('UPDATE appointments SET reminder_sent = true WHERE id = $1', [appt.id]);
    }
    console.log(`[CRON] Sent ${appointments.length} appointment reminders`);
  } catch (err) {
    console.error('[CRON] Appointment reminder error:', err);
  }
});

// ── Every day at 09:00 – birthday messages & bonus points ────────
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Sending birthday messages...');
  try {
    const result = await NotificationService.sendBirthdayMessages();
    console.log(`[CRON] Birthday messages sent: ${result.birthday_messages_sent}`);
  } catch (err) {
    console.error('[CRON] Birthday error:', err);
  }
});

// ── Every Monday at 10:00 – service due reminders ────────────────
cron.schedule('0 10 * * 1', async () => {
  console.log('[CRON] Sending service reminders...');
  try {
    const result = await NotificationService.sendServiceReminders();
    console.log(`[CRON] Service reminders sent: ${result.reminders_sent}`);
  } catch (err) {
    console.error('[CRON] Service reminder error:', err);
  }
});

// ── Every day at 02:00 – expire old points ───────────────────────
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Expiring old points...');
  try {
    const result = await PointsEngine.expirePoints();
    console.log(`[CRON] Points expired for ${result.expired_users} users`);
  } catch (err) {
    console.error('[CRON] Points expiry error:', err);
  }
});

// ── Every 1st of month at 06:00 – monthly loyalty report ────────
cron.schedule('0 6 1 * *', async () => {
  console.log('[CRON] Monthly report...');
  // TODO: send monthly summary email to admin
});
