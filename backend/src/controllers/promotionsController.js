const db = require('../config/db');

exports.getActive = async (req, res, next) => {
  try {
    const tier = req.user?.membership_tier || null;
    const { rows } = await db.query(`
      SELECT * FROM promotions
      WHERE is_active = true AND start_date <= NOW() AND end_date >= NOW()
        AND (applicable_tiers IS NULL OR $1 = ANY(applicable_tiers) OR $1 IS NULL)
      ORDER BY end_date ASC`,
      [tier]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows: [p] } = await db.query(
      'SELECT * FROM promotions WHERE id = $1', [req.params.id]
    );
    if (!p) return res.status(404).json({ error: 'Promotion not found' });
    res.json(p);
  } catch (err) { next(err); }
};

exports.validateCode = async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    const { rows: [p] } = await db.query(`
      SELECT * FROM promotions
      WHERE promo_code = $1 AND is_active = true
        AND start_date <= NOW() AND end_date >= NOW()`,
      [code]
    );
    if (!p) return res.status(404).json({ error: '优惠码无效或已过期 / Invalid or expired code' });
    if (p.min_spend && amount < p.min_spend)
      return res.status(400).json({ error: `最低消费 $${p.min_spend} / Minimum spend $${p.min_spend}` });
    if (p.usage_limit && p.usage_count >= p.usage_limit)
      return res.status(400).json({ error: '优惠码已用完 / Code fully redeemed' });

    let discount = 0;
    if (p.promo_type === 'percentage_off') discount = amount * (p.discount_value / 100);
    else if (p.promo_type === 'fixed_off')   discount = p.discount_value;

    res.json({
      valid:       true,
      promo_type:  p.promo_type,
      discount:    Math.min(discount, amount),
      bonus_points: p.bonus_points || 0,
      title_zh:    p.title_zh,
      title_en:    p.title_en,
    });
  } catch (err) { next(err); }
};

exports.getAllAdmin = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const fields = ['title_zh','title_en','description_zh','description_en','promo_type',
                    'discount_value','bonus_points','min_spend','applicable_tiers',
                    'promo_code','usage_limit','per_user_limit','start_date','end_date'];
    const vals = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, i) => `$${i+1}`).join(',');
    const { rows: [p] } = await db.query(
      `INSERT INTO promotions (${fields.join(',')}) VALUES (${placeholders}) RETURNING *`, vals
    );
    res.status(201).json(p);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const allowed = ['title_zh','title_en','description_zh','description_en',
                     'discount_value','bonus_points','min_spend','end_date','is_active'];
    const updates = allowed.filter(f => req.body[f] !== undefined);
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    const set = updates.map((f, i) => `${f} = $${i+2}`).join(', ');
    const { rows: [p] } = await db.query(
      `UPDATE promotions SET ${set} WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(f => req.body[f])]
    );
    if (!p) return res.status(404).json({ error: 'Promotion not found' });
    res.json(p);
  } catch (err) { next(err); }
};

exports.deactivate = async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      'UPDATE promotions SET is_active = false WHERE id = $1', [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Promotion not found' });
    res.json({ message: 'Promotion deactivated' });
  } catch (err) { next(err); }
};
