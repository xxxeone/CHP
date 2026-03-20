const db = require('../config/db');
const NotificationService = require('../utils/notificationService');

// Business hours: Mon-Sat 08:00-17:30, slots every 30 min
const BUSINESS_HOURS = { start: 8, end: 17, days: [1, 2, 3, 4, 5, 6] }; // 0=Sun
const SLOT_DURATION  = 30; // minutes

// GET /api/appointments
exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let where = 'WHERE a.user_id = $1';

    if (status) { params.push(status); where += ` AND a.status = $${params.length}`; }

    const { rows } = await db.query(`
      SELECT a.*, v.make, v.model, v.year, v.license_plate, v.color
      FROM appointments a
      JOIN vehicles v ON v.id = a.vehicle_id
      ${where}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const { rows: [{ count }] } = await db.query(
      `SELECT COUNT(*) FROM appointments WHERE user_id = $1${status ? ' AND status = $2' : ''}`,
      status ? [req.user.id, status] : [req.user.id]
    );

    res.json({ data: rows, pagination: { page: +page, limit: +limit, total: +count } });
  } catch (err) { next(err); }
};

// GET /api/appointments/available-slots
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const d = new Date(date);
    const dayOfWeek = d.getDay();
    if (!BUSINESS_HOURS.days.includes(dayOfWeek))
      return res.json({ available: false, message: '该日不营业 / Not a business day', slots: [] });

    // Booked slots on this date
    const { rows: booked } = await db.query(`
      SELECT TO_CHAR(appointment_time, 'HH24:MI') AS time_slot
      FROM appointments
      WHERE appointment_date = $1 AND status NOT IN ('cancelled')
    `, [date]);

    const bookedTimes = new Set(booked.map(r => r.time_slot));

    // Generate all slots
    const slots = [];
    for (let h = BUSINESS_HOURS.start; h < BUSINESS_HOURS.end; h++) {
      for (let m = 0; m < 60; m += SLOT_DURATION) {
        const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        slots.push({ time, available: !bookedTimes.has(time) });
      }
    }

    res.json({ date, slots });
  } catch (err) { next(err); }
};

// GET /api/appointments/upcoming
exports.getUpcoming = async (req, res, next) => {
  try {
    const { rows: [appt] } = await db.query(`
      SELECT a.*, v.make, v.model, v.year, v.color, v.license_plate
      FROM appointments a
      JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.user_id = $1
        AND a.appointment_date >= CURRENT_DATE
        AND a.status IN ('pending','confirmed')
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 1
    `, [req.user.id]);

    res.json(appt || null);
  } catch (err) { next(err); }
};

// GET /api/appointments/:id
exports.getOne = async (req, res, next) => {
  try {
    const { rows: [appt] } = await db.query(`
      SELECT a.*, v.make, v.model, v.year, v.color, v.license_plate, v.vin
      FROM appointments a
      JOIN vehicles v ON v.id = a.vehicle_id
      WHERE a.id = $1 AND a.user_id = $2
    `, [req.params.id, req.user.id]);

    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) { next(err); }
};

// POST /api/appointments
exports.create = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { vehicle_id, appointment_date, appointment_time, service_type, description, customer_notes } = req.body;

    // Verify vehicle belongs to user
    const { rows: [vehicle] } = await client.query(
      'SELECT id FROM vehicles WHERE id = $1 AND user_id = $2', [vehicle_id, req.user.id]
    );
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Check slot availability
    const { rows: [conflict] } = await client.query(`
      SELECT id FROM appointments
      WHERE appointment_date = $1 AND appointment_time = $2
        AND status NOT IN ('cancelled')
    `, [appointment_date, appointment_time]);
    if (conflict) return res.status(409).json({ error: '该时间段已被预约 / Slot already booked' });

    const { rows: [appt] } = await client.query(`
      INSERT INTO appointments
        (user_id, vehicle_id, appointment_date, appointment_time,
         service_type, description, customer_notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [req.user.id, vehicle_id, appointment_date, appointment_time,
        service_type, description, customer_notes]);

    await client.query('COMMIT');

    // Send confirmation notification (async)
    NotificationService.sendAppointmentConfirmation(req.user, appt).catch(console.error);

    res.status(201).json(appt);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PUT /api/appointments/:id
exports.update = async (req, res, next) => {
  try {
    const { rows: [existing] } = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });
    if (['completed','cancelled'].includes(existing.status))
      return res.status(400).json({ error: '无法修改已完成或已取消的预约 / Cannot modify completed or cancelled appointment' });

    const fields = ['appointment_date','appointment_time','service_type','description','customer_notes'];
    const updates = fields.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    const setClauses = updates.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = updates.map(f => req.body[f]);

    const { rows: [appt] } = await db.query(
      `UPDATE appointments SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    res.json(appt);
  } catch (err) { next(err); }
};

// DELETE /api/appointments/:id/cancel
exports.cancel = async (req, res, next) => {
  try {
    const { rows: [appt] } = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]
    );
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status === 'cancelled') return res.status(400).json({ error: '已取消 / Already cancelled' });

    // Check 24h cancellation policy
    const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
    const hoursUntil = (apptDateTime - Date.now()) / 3_600_000;
    if (hoursUntil < 24)
      return res.status(400).json({ error: '预约24小时内无法取消 / Cannot cancel within 24 hours' });

    await db.query(`
      UPDATE appointments
      SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $2, updated_at = NOW()
      WHERE id = $1
    `, [req.params.id, req.body.reason]);

    res.json({ message: '预约已取消 / Appointment cancelled' });
  } catch (err) { next(err); }
};

// POST /api/appointments/:id/confirm  [Admin]
exports.confirm = async (req, res, next) => {
  try {
    const { rows: [appt] } = await db.query(`
      UPDATE appointments
      SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [req.params.id]);

    if (!appt) return res.status(404).json({ error: 'Not found' });

    // Notify customer
    const { rows: [user] } = await db.query('SELECT * FROM users WHERE id = $1', [appt.user_id]);
    NotificationService.sendAppointmentConfirmation(user, appt).catch(console.error);

    res.json(appt);
  } catch (err) { next(err); }
};

// POST /api/appointments/:id/complete  [Admin]
exports.complete = async (req, res, next) => {
  try {
    const { rows: [appt] } = await db.query(`
      UPDATE appointments SET status = 'completed', updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [req.params.id]);
    if (!appt) return res.status(404).json({ error: 'Not found' });
    res.json(appt);
  } catch (err) { next(err); }
};
