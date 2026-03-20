const db = require('../config/db');
const PointsEngine = require('../utils/pointsEngine');

exports.getPublished = async (req, res, next) => {
  try {
    const { rating, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = "WHERE r.status = 'published'";
    const params = [];
    if (rating) { params.push(+rating); where += ` AND r.overall_rating = $${params.length}`; }

    const { rows } = await db.query(`
      SELECT r.id, r.overall_rating, r.service_rating, r.speed_rating,
             r.comment, r.created_at,
             CASE WHEN r.is_anonymous THEN '匿名用户' ELSE u.first_name END AS reviewer_name,
             v.make, v.model, v.year
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN service_records sr ON sr.id = r.record_id
      JOIN vehicles v ON v.id = sr.vehicle_id
      ${where} ORDER BY r.created_at DESC
      LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getMy = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, v.make, v.model, v.year
      FROM reviews r
      JOIN service_records sr ON sr.id = r.record_id
      JOIN vehicles v ON v.id = sr.vehicle_id
      WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { record_id, overall_rating, service_rating,
            price_rating, speed_rating, comment, is_anonymous } = req.body;

    // Verify record belongs to user
    const { rows: [rec] } = await db.query(
      'SELECT id FROM service_records WHERE id = $1 AND user_id = $2', [record_id, req.user.id]
    );
    if (!rec) return res.status(404).json({ error: 'Service record not found' });

    // Prevent duplicate review
    const { rows: [dup] } = await db.query(
      'SELECT id FROM reviews WHERE record_id = $1 AND user_id = $2', [record_id, req.user.id]
    );
    if (dup) return res.status(409).json({ error: '已提交评价 / Already reviewed' });

    const { rows: [review] } = await db.query(`
      INSERT INTO reviews
        (user_id, record_id, overall_rating, service_rating,
         price_rating, speed_rating, comment, is_anonymous, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING *`,
      [req.user.id, record_id, overall_rating, service_rating,
       price_rating, speed_rating, comment, is_anonymous || false]
    );

    // Award review points (+50) async
    PointsEngine.awardReviewPoints(req.user.id, review.id).catch(console.error);

    res.status(201).json({ ...review, points_awarded: 50 });
  } catch (err) { next(err); }
};

exports.publish = async (req, res, next) => {
  try {
    const { rows: [r] } = await db.query(
      "UPDATE reviews SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!r) return res.status(404).json({ error: 'Review not found' });
    res.json(r);
  } catch (err) { next(err); }
};
