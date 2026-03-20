const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { rows: categories } = await db.query(
      'SELECT * FROM service_categories WHERE is_active = true ORDER BY sort_order'
    );
    const { rows: services } = await db.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY category_id, name_zh'
    );
    const result = categories.map(cat => ({
      ...cat,
      services: services.filter(s => s.category_id === cat.id),
    }));
    res.json(result);
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM service_categories WHERE is_active = true ORDER BY sort_order'
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows: [s] } = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (!s) return res.status(404).json({ error: 'Service not found' });
    res.json(s);
  } catch (err) { next(err); }
};

exports.getMyRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const { rows } = await db.query(`
      SELECT sr.*,
             v.make, v.model, v.year, v.license_plate,
             json_agg(json_build_object(
               'name_zh', s.name_zh, 'name_en', s.name_en,
               'quantity', sri.quantity, 'unit_price', sri.unit_price,
               'total_price', sri.total_price
             )) AS items
      FROM service_records sr
      JOIN vehicles v ON v.id = sr.vehicle_id
      LEFT JOIN service_record_items sri ON sri.record_id = sr.id
      LEFT JOIN services s ON s.id = sri.service_id
      WHERE sr.user_id = $1
      GROUP BY sr.id, v.id
      ORDER BY sr.service_date DESC
      LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    const { rows: [{ count }] } = await db.query(
      'SELECT COUNT(*) FROM service_records WHERE user_id = $1', [req.user.id]
    );
    res.json({ data: rows, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) { next(err); }
};

exports.getRecordDetail = async (req, res, next) => {
  try {
    const { rows: [record] } = await db.query(`
      SELECT sr.*, v.make, v.model, v.year, v.license_plate,
             json_agg(json_build_object(
               'name_zh', s.name_zh, 'name_en', s.name_en,
               'quantity', sri.quantity, 'unit_price', sri.unit_price, 'total_price', sri.total_price
             )) AS items
      FROM service_records sr
      JOIN vehicles v ON v.id = sr.vehicle_id
      LEFT JOIN service_record_items sri ON sri.record_id = sr.id
      LEFT JOIN services s ON s.id = sri.service_id
      WHERE sr.id = $1 AND sr.user_id = $2
      GROUP BY sr.id, v.id`,
      [req.params.id, req.user.id]
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) { next(err); }
};

exports.createRecord = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const {
      user_id, vehicle_id, appointment_id,
      service_date, mileage_at_service,
      subtotal, discount_amount, final_amount,
      technician_notes, items = [],
    } = req.body;

    const { rows: [record] } = await client.query(`
      INSERT INTO service_records
        (user_id, vehicle_id, appointment_id, service_date, mileage_at_service,
         subtotal, discount_amount, final_amount, technician_notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [user_id, vehicle_id, appointment_id, service_date, mileage_at_service,
       subtotal, discount_amount || 0, final_amount, technician_notes]
    );

    for (const item of items) {
      await client.query(`
        INSERT INTO service_record_items (record_id, service_id, quantity, unit_price, total_price)
        VALUES ($1,$2,$3,$4,$5)`,
        [record.id, item.service_id, item.quantity, item.unit_price, item.total_price]
      );
    }

    // Update vehicle mileage
    if (mileage_at_service) {
      await client.query(
        'UPDATE vehicles SET mileage = $1, last_service_mileage = $1 WHERE id = $2',
        [mileage_at_service, vehicle_id]
      );
    }

    // Mark appointment completed
    if (appointment_id) {
      await client.query(
        'UPDATE appointments SET status = $1 WHERE id = $2', ['completed', appointment_id]
      );
    }

    await client.query('COMMIT');

    // Award points (async, after commit)
    const PointsEngine = require('../utils/pointsEngine');
    PointsEngine.awardServicePoints(user_id, record.id, final_amount).catch(console.error);

    res.status(201).json(record);
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};
