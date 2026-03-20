const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows: [v] } = await db.query(
      'SELECT * FROM vehicles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(v);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { nickname, make, model, year, color, license_plate, vin,
            fuel_type, transmission, engine_size, mileage, is_primary, notes } = req.body;

    // If setting as primary, clear existing primary
    if (is_primary) {
      await db.query('UPDATE vehicles SET is_primary = false WHERE user_id = $1', [req.user.id]);
    }

    // First vehicle is automatically primary
    const { rows: [{ count }] } = await db.query(
      'SELECT COUNT(*) FROM vehicles WHERE user_id = $1', [req.user.id]
    );

    const { rows: [vehicle] } = await db.query(`
      INSERT INTO vehicles
        (user_id, nickname, make, model, year, color, license_plate, vin,
         fuel_type, transmission, engine_size, mileage, is_primary, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [req.user.id, nickname, make, model, year, color, license_plate, vin,
       fuel_type, transmission, engine_size, mileage || 0,
       is_primary || count === '0', notes]
    );
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { rows: [existing] } = await db.query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: 'Vehicle not found' });

    const allowed = ['nickname','make','model','year','color','license_plate','vin',
                     'fuel_type','transmission','engine_size','mileage','notes'];
    const updates = allowed.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    const set = updates.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const { rows: [v] } = await db.query(
      `UPDATE vehicles SET ${set}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(f => req.body[f])]
    );
    res.json(v);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM vehicles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: '删除成功 / Vehicle deleted' });
  } catch (err) { next(err); }
};

exports.setPrimary = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { rows: [v] } = await client.query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    await client.query('UPDATE vehicles SET is_primary = false WHERE user_id = $1', [req.user.id]);
    await client.query('UPDATE vehicles SET is_primary = true WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ message: '已设为主要车辆 / Set as primary vehicle' });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
};

exports.getServiceHistory = async (req, res, next) => {
  try {
    const { rows: [v] } = await db.query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    const { rows } = await db.query(`
      SELECT sr.*, array_agg(json_build_object(
        'service_name_zh', s.name_zh,
        'service_name_en', s.name_en,
        'qty', sri.quantity,
        'price', sri.total_price
      )) AS items
      FROM service_records sr
      LEFT JOIN service_record_items sri ON sri.record_id = sr.id
      LEFT JOIN services s ON s.id = sri.service_id
      WHERE sr.vehicle_id = $1
      GROUP BY sr.id ORDER BY sr.service_date DESC`, [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.updateMileage = async (req, res, next) => {
  try {
    const { mileage } = req.body;
    const { rows: [v] } = await db.query(
      'UPDATE vehicles SET mileage = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [mileage, req.params.id, req.user.id]
    );
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(v);
  } catch (err) { next(err); }
};
