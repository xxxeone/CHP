const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { unread_only, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE user_id = $1';
    const params = [req.user.id];
    if (unread_only === 'true') { params.push(false); where += ` AND is_read = $${params.length}`; }

    const { rows } = await db.query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: [{ count }] } = await db.query(`SELECT COUNT(*) FROM notifications ${where}`, params);
    res.json({ data: rows, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) { next(err); }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const { rows: [{ count }] } = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ unread_count: +count });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: '已标记已读 / Marked as read' });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ updated: rowCount });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.updatePushToken = async (req, res, next) => {
  try {
    const { push_token } = req.body;
    await db.query('UPDATE users SET push_token = $1 WHERE id = $2', [push_token, req.user.id]);
    res.json({ message: 'Push token updated' });
  } catch (err) { next(err); }
};

// Notification preferences stored as JSONB in users table
// Simplified: return defaults for MVP
exports.getPreferences = async (req, res, next) => {
  res.json({
    appointment_reminder: true,
    service_completed:    true,
    points_earned:        true,
    promotions:           true,
    service_reminder:     true,
    birthday:             true,
  });
};

exports.updatePreferences = async (req, res, next) => {
  // TODO: persist to users.notification_prefs JSONB column (future iteration)
  res.json({ message: 'Preferences updated', preferences: req.body });
};

exports.sendPush = async (req, res, next) => {
  try {
    const NotificationService = require('../utils/notificationService');
    const { user_ids, tier, title_zh, title_en, body_zh, body_en, type } = req.body;

    let targetUsers = [];
    if (user_ids?.length) {
      const { rows } = await db.query('SELECT id FROM users WHERE id = ANY($1)', [user_ids]);
      targetUsers = rows.map(r => r.id);
    } else if (tier) {
      const { rows } = await db.query(
        'SELECT id FROM users WHERE membership_tier = $1 AND is_active = true', [tier]
      );
      targetUsers = rows.map(r => r.id);
    } else {
      const { rows } = await db.query('SELECT id FROM users WHERE is_active = true');
      targetUsers = rows.map(r => r.id);
    }

    await Promise.all(
      targetUsers.map(id => NotificationService.send(id, { title_zh, title_en, body_zh, body_en, type }))
    );
    res.json({ sent_to: targetUsers.length });
  } catch (err) { next(err); }
};
