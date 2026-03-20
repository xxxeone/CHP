const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/usersController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

/**
 * @route  GET /api/users/me
 * @desc   获取当前用户信息 Get current user profile
 */
router.get('/me', ctrl.getMe);

/**
 * @route  PUT /api/users/me
 * @desc   更新个人信息 Update profile
 */
router.put('/me', validate(Joi.object({
  first_name:     Joi.string().min(1).max(100).optional(),
  last_name:      Joi.string().min(1).max(100).optional(),
  email:          Joi.string().email().optional(),
  date_of_birth:  Joi.date().max('now').optional(),
  gender:         Joi.string().valid('male','female','other').optional(),
  preferred_lang: Joi.string().valid('zh','en').optional(),
})), ctrl.updateMe);

/**
 * @route  POST /api/users/me/avatar
 * @desc   上传头像 Upload avatar
 */
router.post('/me/avatar', ctrl.uploadAvatar);

/**
 * @route  GET /api/users/me/dashboard
 * @desc   首页仪表盘数据 Get home dashboard data
 *         Returns: points balance, tier, upcoming appointment,
 *                  vehicles, recent activity, active promotions
 */
router.get('/me/dashboard', ctrl.getDashboard);

/**
 * @route  GET /api/users/me/stats
 * @desc   获取消费统计 Get spending statistics
 * @query  year
 */
router.get('/me/stats', ctrl.getStats);

/**
 * @route  DELETE /api/users/me
 * @desc   注销账号 Delete account
 */
router.delete('/me', ctrl.deleteAccount);

// ── Admin endpoints ───────────────────────────────────────────

/**
 * @route  GET /api/users  [Admin]
 * @desc   获取所有用户 List all users
 */
router.get('/', isAdmin, ctrl.listAll);

/**
 * @route  GET /api/users/:id  [Admin]
 * @desc   获取用户详情 Get user detail
 */
router.get('/:id', isAdmin, ctrl.getById);

/**
 * @route  PUT /api/users/:id/status  [Admin]
 * @desc   启用/停用用户 Toggle user status
 */
router.put('/:id/status', isAdmin, validate(Joi.object({
  is_active: Joi.boolean().required()
})), ctrl.setStatus);

module.exports = router;
