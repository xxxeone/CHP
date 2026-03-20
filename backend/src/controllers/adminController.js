const db = require('../config/db');
const NotificationService = require('../utils/notificationService');
const PointsEngine = require('../utils/pointsEngine');

exports.getDashboard = async (req, res, next) => {
  try {
    const [usersRes, apptTodayRes, monthlyRevenueRes, pointsRes, tiersRes] = await Promise.all([
      db.query('SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active) AS active FROM users'),
      db.query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE AND status != 'cancelled'"),
      db.query(`SELECT COALESCE(SUM(final_amount),0) AS revenue
                FROM service_records WHERE DATE_TRUNC('month', service_date) = DATE_TRUNC('month', NOW())`),
      db.query(`SELECT
                  COALESCE(SUM(points) FILTER (WHERE points > 0), 0) AS total_issued,
                  COALESCE(ABS(SUM(points) FILTER (WHERE points < 0)), 0) AS total_redeemed
                FROM loyalty_points`),
      db.query(`SELECT membership_tier, COUNT(*) AS count
                FROM users GROUP BY membership_tier`),
    ]);
    res.json({
      users:           { total: +usersRes.rows[0].total, active: +usersRes.rows[0].active },
      todays_appointments: +apptTodayRes.rows[0].count,
      monthly_revenue: parseFloat(monthlyRevenueRes.rows[0].revenue),
      points:          { issued: +pointsRes.rows[0].total_issued, redeemed: +pointsRes.rows[0].total_redeemed },
      tier_distribution: tiersRes.rows,
    });
  } catch (err) { next(err); }
};

exports.getTodayAppointments = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT a.*, u.first_name, u.last_name, u.phone,
             v.make, v.model, v.year, v.license_plate
      FROM appointments a
      JOIN users u ON u.id = a.user_id
      JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.appointment_date = CURRENT_DATE
        AND a.status != 'cancelled'
      ORDER BY a.appointment_time`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getCalendar = async (req, res, next) => {
  try {
    const { month = new Date().toISOString().slice(0,7) } = req.query;
    const { rows } = await db.query(`
      SELECT appointment_date, COUNT(*) AS count,
             COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
             COUNT(*) FILTER (WHERE status = 'pending') AS pending
      FROM appointments
      WHERE TO_CHAR(appointment_date, 'YYYY-MM') = $1
        AND status != 'cancelled'
      GROUP BY appointment_date ORDER BY appointment_date`,
      [month]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q, tier, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (phone ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    if (tier) { params.push(tier); where += ` AND membership_tier = $${params.length}`; }

    const { rows } = await db.query(
      `SELECT id, phone, email, first_name, last_name, membership_tier, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    const { rows: [{ count }] } = await db.query(`SELECT COUNT(*) FROM users ${where}`, params);
    res.json({ data: rows, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) { next(err); }
};

exports.revenueReport = async (req, res, next) => {
  try {
    const { from, to, groupBy = 'month' } = req.query;
    const format = groupBy === 'day' ? 'YYYY-MM-DD' : groupBy === 'week' ? 'IYYY-IW' : 'YYYY-MM';
    const { rows } = await db.query(`
      SELECT TO_CHAR(service_date, $1) AS period,
             COUNT(*) AS records,
             SUM(final_amount) AS revenue,
             SUM(points_earned) AS points_issued
      FROM service_records
      WHERE ($2::date IS NULL OR service_date >= $2)
        AND ($3::date IS NULL OR service_date <= $3)
      GROUP BY period ORDER BY period`,
      [format, from || null, to || null]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.pointsReport = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT transaction_type,
             COUNT(*) AS count,
             SUM(ABS(points)) AS total_points
      FROM loyalty_points
      GROUP BY transaction_type ORDER BY total_points DESC`
    );
    const { rows: [totals] } = await db.query(`
      SELECT
        COALESCE(SUM(points) FILTER (WHERE points > 0), 0) AS total_issued,
        COALESCE(ABS(SUM(points) FILTER (WHERE points < 0 AND transaction_type LIKE 'redeem%')), 0) AS total_redeemed,
        COALESCE(ABS(SUM(points) FILTER (WHERE transaction_type = 'expire')), 0) AS total_expired,
        COUNT(DISTINCT user_id) AS users_with_points
      FROM loyalty_points`
    );
    res.json({ by_type: rows, totals });
  } catch (err) { next(err); }
};

exports.sendReminders = async (req, res, next) => {
  try {
    const result = await NotificationService.sendServiceReminders();
    res.json(result);
  } catch (err) { next(err); }
};

exports.createServiceRecord = async (req, res, next) => {
  // Delegates to servicesController.createRecord
  return require('./servicesController').createRecord(req, res, next);
};
