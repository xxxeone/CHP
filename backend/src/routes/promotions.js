const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/promotionsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

/**
 * @route  GET /api/promotions
 * @desc   获取当前有效促销 Get active promotions
 * @access Public (enhanced for authenticated users)
 */
router.get('/', ctrl.getActive);

/**
 * @route  GET /api/promotions/:id
 * @desc   获取促销详情 Get promotion detail
 * @access Public
 */
router.get('/:id', ctrl.getOne);

/**
 * @route  POST /api/promotions/validate-code
 * @desc   验证促销码 Validate promo code
 * @access Private
 */
router.post('/validate-code', authenticate, validate(Joi.object({
  code:   Joi.string().required(),
  amount: Joi.number().positive().required(),
})), ctrl.validateCode);

/**
 * @route  GET /api/promotions/admin/all  [Admin]
 * @desc   获取所有促销（含历史）Get all promotions incl. expired
 */
router.get('/admin/all', authenticate, isAdmin, ctrl.getAllAdmin);

/**
 * @route  POST /api/promotions  [Admin]
 * @desc   创建促销活动 Create promotion
 */
router.post('/', authenticate, isAdmin, validate(Joi.object({
  title_zh:    Joi.string().required(),
  title_en:    Joi.string().required(),
  description_zh: Joi.string().optional(),
  description_en: Joi.string().optional(),
  promo_type:  Joi.string().valid('percentage_off','fixed_off','double_points','free_service','bonus_points').required(),
  discount_value: Joi.number().optional(),
  bonus_points:   Joi.number().integer().optional(),
  min_spend:      Joi.number().min(0).optional(),
  applicable_tiers: Joi.array().items(Joi.string()).optional(),
  promo_code:     Joi.string().optional(),
  usage_limit:    Joi.number().integer().optional(),
  per_user_limit: Joi.number().integer().optional(),
  start_date:     Joi.date().required(),
  end_date:       Joi.date().min(Joi.ref('start_date')).required(),
})), ctrl.create);

/**
 * @route  PUT /api/promotions/:id  [Admin]
 * @desc   修改促销 Update promotion
 */
router.put('/:id', authenticate, isAdmin, ctrl.update);

/**
 * @route  DELETE /api/promotions/:id  [Admin]
 * @desc   删除/停用促销 Deactivate promotion
 */
router.delete('/:id', authenticate, isAdmin, ctrl.deactivate);

module.exports = router;
