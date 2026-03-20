const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/pointsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

/**
 * @route  GET /api/points/summary
 * @desc   获取积分摘要（余额、等级、下一等级进度）
 *         Get points summary: balance, tier, progress to next tier
 */
router.get('/summary', ctrl.getSummary);

/**
 * @route  GET /api/points/history
 * @desc   获取积分历史记录 Get points transaction history
 * @query  type, page, limit
 */
router.get('/history', ctrl.getHistory);

/**
 * @route  GET /api/points/expiring
 * @desc   获取即将过期积分 Get expiring points (within 30 days)
 */
router.get('/expiring', ctrl.getExpiring);

/**
 * @route  GET /api/points/rewards
 * @desc   获取可兑换奖励列表 Get redeemable rewards catalog
 */
router.get('/rewards', ctrl.getRewards);

/**
 * @route  POST /api/points/redeem
 * @desc   兑换积分 Redeem points for reward
 * @body   { reward_id, points_to_use }
 */
router.post('/redeem', validate(Joi.object({
  reward_id:     Joi.string().uuid().required(),
  points_to_use: Joi.number().integer().min(100).required(),
})), ctrl.redeem);

/**
 * @route  POST /api/points/checkin
 * @desc   每日签到获取积分 Daily check-in for bonus points
 */
router.post('/checkin', ctrl.dailyCheckin);

/**
 * @route  GET /api/points/tiers
 * @desc   获取所有会员等级信息 Get all tier information
 */
router.get('/tiers', ctrl.getTiers);

/**
 * @route  POST /api/points/adjust  [Admin]
 * @desc   手动调整积分 Manually adjust user points
 */
router.post('/adjust', isAdmin, validate(Joi.object({
  user_id:     Joi.string().uuid().required(),
  points:      Joi.number().integer().required(),
  reason:      Joi.string().max(500).required(),
})), ctrl.adminAdjust);

/**
 * @route  POST /api/points/earn-from-service  [Admin]
 * @desc   消费后添加积分 Award points after service
 */
router.post('/earn-from-service', isAdmin, validate(Joi.object({
  user_id:   Joi.string().uuid().required(),
  record_id: Joi.string().uuid().required(),
  amount:    Joi.number().positive().required(),
})), ctrl.earnFromService);

module.exports = router;
