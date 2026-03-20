const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { phone, email, password, first_name, last_name, referred_by_code } = req.body;

    // Check existing user
    const existing = await client.query(
      'SELECT id FROM users WHERE phone = $1 OR email = $2',
      [phone, email]
    );
    if (existing.rows.length)
      return res.status(409).json({ error: '手机号或邮箱已注册 / Phone or email already registered' });

    // Resolve referral
    let referrerId = null;
    if (referred_by_code) {
      const ref = await client.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referred_by_code]
      );
      referrerId = ref.rows[0]?.id || null;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await client.query(
      `INSERT INTO users (phone, email, password_hash, first_name, last_name, referred_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, phone, email, first_name, last_name, membership_tier, referral_code`,
      [phone, email, password_hash, first_name, last_name, referrerId]
    );
    const user = rows[0];

    // Welcome bonus points
    await client.query(
      `INSERT INTO loyalty_points (user_id, transaction_type, points, balance_after, description_zh, description_en)
       VALUES ($1, 'earn_promotion', 200,
         (SELECT COALESCE(SUM(points),0) FROM loyalty_points WHERE user_id=$1) + 200,
         '新会员注册礼遇', 'Welcome bonus points')`,
      [user.id]
    );

    // Referral bonus
    if (referrerId) {
      await client.query(
        `INSERT INTO loyalty_points (user_id, transaction_type, points, balance_after, description_zh, description_en, reference_id, reference_type)
         VALUES ($1, 'earn_referral', 500,
           (SELECT COALESCE(SUM(points),0) FROM loyalty_points WHERE user_id=$1) + 500,
           '成功推荐新会员奖励', 'Referral bonus', $2, 'user')`,
        [referrerId, user.id]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({ user, token, refreshToken });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const { rows } = await db.query(
      `SELECT id, phone, email, password_hash, first_name, last_name,
              membership_tier, referral_code, is_active
       FROM users WHERE phone = $1`,
      [phone]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: '手机号或密码不正确 / Invalid credentials' });

    if (!user.is_active)
      return res.status(403).json({ error: '账号已停用 / Account disabled' });

    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ user: safeUser, token, refreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ error: 'Refresh token required' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = generateToken(payload.userId);
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/send-otp
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (in production, use Redis)
    await db.query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = $3, attempts = 0`,
      [phone, await bcrypt.hash(otp, 6), expiresAt]
    );

    // In production: send SMS via Twilio
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ message: '验证码已发送 / OTP sent', expiresIn: 600 });
  } catch (err) {
    next(err);
  }
};
