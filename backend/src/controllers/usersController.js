const db = require('../config/db');

// GET /api/users/me
exports.getMe = async (req, res, next) => {
  try {
    const { rows: [user] } = await db.query(`
      SELECT u.id, u.phone, u.email, u.first_name, u.last_name, u.avatar_url,
             u.date_of_birth, u.gender, u.preferred_lang, u.membership_tier,
             u.referral_code, u.created_at, u.last_login_at,
             mt.name_zh AS tier_name_zh, mt.name_en AS tier_name_en,
             mt.color AS tier_color, mt.benefits_zh, mt.benefits_en,
             mt.points_per_dollar, mt.discount_percent,
             COALESCE(SUM(lp.points), 0) AS points_balance
      FROM users u
      JOIN membership_tiers mt ON mt.tier = u.membership_tier
      LEFT JOIN loyalty_points lp ON lp.user_id = u.id
        AND (lp.expires_at IS NULL OR lp.expires_at > NOW())
      WHERE u.id = $1
      GROUP BY u.id, mt.tier
    `, [req.user.id]);

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

// PUT /api/users/me
exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['first_name','last_name','email','date_of_birth','gender','preferred_lang'];
    const updates = allowed.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    const setClauses = updates.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = updates.map(f => req.body[f]);

    const { rows: [user] } = await db.query(
      `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $1
       RETURNING id, phone, email, first_name, last_name, gender, preferred_lang, avatar_url`,
      [req.user.id, ...values]
    );
    res.json(user);
  } catch (err) { next(err); }
};

// GET /api/users/me/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [userRes, vehiclesRes, upcomingRes, recentPointsRes, activePromosRes] =
      await Promise.all([
        db.query(`
          SELECT u.first_name, u.membership_tier, mt.name_zh, mt.name_en, mt.color,
                 mt.points_per_dollar, mt.discount_percent,
                 COALESCE(SUM(lp.points), 0) AS points_balance
          FROM users u
          JOIN membership_tiers mt ON mt.tier = u.membership_tier
          LEFT JOIN loyalty_points lp ON lp.user_id = u.id
            AND (lp.expires_at IS NULL OR lp.expires_at > NOW())
          WHERE u.id = $1 GROUP BY u.id, mt.tier
        `, [userId]),

        db.query(
          'SELECT id, nickname, make, model, year, color, mileage, is_primary FROM vehicles WHERE user_id = $1 ORDER BY is_primary DESC LIMIT 3',
          [userId]
        ),

        db.query(`
          SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.service_type,
                 v.make, v.model, v.year
          FROM appointments a JOIN vehicles v ON v.id = a.vehicle_id
          WHERE a.user_id = $1 AND a.appointment_date >= CURRENT_DATE
            AND a.status IN ('pending','confirmed')
          ORDER BY a.appointment_date ASC LIMIT 1
        `, [userId]),

        db.query(`
          SELECT transaction_type, points, description_zh, description_en, created_at
          FROM loyalty_points WHERE user_id = $1
          ORDER BY created_at DESC LIMIT 5
        `, [userId]),

        db.query(`
          SELECT id, title_zh, title_en, promo_type, discount_value, end_date, image_url
          FROM promotions
          WHERE is_active = true AND start_date <= NOW() AND end_date >= NOW()
            AND (applicable_tiers IS NULL OR $1 = ANY(applicable_tiers))
          ORDER BY end_date ASC LIMIT 3
        `, [req.user.membership_tier]),
      ]);

    const user = userRes.rows[0];
    // Points to next tier
    const tierOrder = ['bronze','silver','gold','platinum'];
    const tierThresholds = { bronze: 0, silver: 1000, gold: 5000, platinum: 20000 };
    const currentIdx = tierOrder.indexOf(user.membership_tier);
    const nextTier = tierOrder[currentIdx + 1];
    const pointsToNext = nextTier
      ? Math.max(0, tierThresholds[nextTier] - parseInt(user.points_balance))
      : 0;

    res.json({
      user: {
        first_name:      user.first_name,
        membership_tier: user.membership_tier,
        tier_name_zh:    user.name_zh,
        tier_name_en:    user.name_en,
        tier_color:      user.color,
        points_balance:  parseInt(user.points_balance),
        points_to_next_tier: pointsToNext,
        next_tier:       nextTier || null,
        discount_percent: parseFloat(user.discount_percent),
      },
      vehicles:          vehiclesRes.rows,
      upcoming_appointment: upcomingRes.rows[0] || null,
      recent_points:     recentPointsRes.rows,
      active_promotions: activePromosRes.rows,
    });
  } catch (err) { next(err); }
};

// GET /api/users/me/stats
exports.getStats = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const userId = req.user.id;

    const [spendRes, servicesRes, vehicleRes] = await Promise.all([
      db.query(`
        SELECT
          TO_CHAR(service_date, 'Mon') AS month,
          EXTRACT(MONTH FROM service_date) AS month_num,
          SUM(final_amount) AS total_spend,
          COUNT(*) AS visit_count
        FROM service_records
        WHERE user_id = $1 AND EXTRACT(YEAR FROM service_date) = $2
        GROUP BY month, month_num ORDER BY month_num
      `, [userId, year]),

      db.query(`
        SELECT sc.name_zh, sc.name_en, sc.color,
               COUNT(*) AS count, SUM(sri.total_price) AS total
        FROM service_record_items sri
        JOIN service_records sr ON sr.id = sri.record_id
        JOIN services s ON s.id = sri.service_id
        JOIN service_categories sc ON sc.id = s.category_id
        WHERE sr.user_id = $1 AND EXTRACT(YEAR FROM sr.service_date) = $2
        GROUP BY sc.id ORDER BY total DESC LIMIT 5
      `, [userId, year]),

      db.query(`
        SELECT SUM(final_amount) AS total_year_spend,
               COUNT(*) AS total_visits,
               COUNT(DISTINCT vehicle_id) AS vehicles_serviced
        FROM service_records
        WHERE user_id = $1 AND EXTRACT(YEAR FROM service_date) = $2
      `, [userId, year]),
    ]);

    res.json({
      year,
      summary:         vehicleRes.rows[0],
      monthly_spend:   spendRes.rows,
      service_breakdown: servicesRes.rows,
    });
  } catch (err) { next(err); }
};

// Stubs for admin endpoints
exports.uploadAvatar = (req, res) => res.json({ message: 'TODO: upload avatar' });
exports.deleteAccount = (req, res) => res.json({ message: 'TODO: delete account' });
exports.listAll = (req, res) => res.json({ message: 'TODO: list all users' });
exports.getById = (req, res) => res.json({ message: 'TODO: get user by id' });
exports.setStatus = (req, res) => res.json({ message: 'TODO: set user status' });
