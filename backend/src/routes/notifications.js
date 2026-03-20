const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/notificationsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

/**
 * @route  GET /api/notifications
 * @desc   获取通知列表 Get notification list
 * @query  unread_only, page, limit
 */
router.get('/', ctrl.getAll);

/**
 * @route  GET /api/notifications/unread-count
 * @desc   获取未读数量 Get unread count
 */
router.get('/unread-count', ctrl.getUnreadCount);

/**
 * @route  PUT /api/notifications/:id/read
 * @desc   标记已读 Mark notification as read
 */
router.put('/:id/read', ctrl.markRead);

/**
 * @route  PUT /api/notifications/read-all
 * @desc   全部标记已读 Mark all as read
 */
router.put('/read-all', ctrl.markAllRead);

/**
 * @route  DELETE /api/notifications/:id
 * @desc   删除通知 Delete notification
 */
router.delete('/:id', ctrl.remove);

/**
 * @route  PUT /api/notifications/push-token
 * @desc   更新推送Token Update push notification token
 */
router.put('/push-token', validate(Joi.object({
  push_token: Joi.string().required(),
  platform:   Joi.string().valid('ios','android').required(),
})), ctrl.updatePushToken);

/**
 * @route  GET /api/notifications/preferences
 * @desc   获取通知偏好设置 Get notification preferences
 */
router.get('/preferences', ctrl.getPreferences);

/**
 * @route  PUT /api/notifications/preferences
 * @desc   更新通知偏好 Update notification preferences
 */
router.put('/preferences', validate(Joi.object({
  appointment_reminder: Joi.boolean(),
  service_completed:    Joi.boolean(),
  points_earned:        Joi.boolean(),
  promotions:           Joi.boolean(),
  service_reminder:     Joi.boolean(),
  birthday:             Joi.boolean(),
})), ctrl.updatePreferences);

/**
 * @route  POST /api/notifications/send  [Admin]
 * @desc   发送推送通知 Send push notification to user(s)
 */
router.post('/send', isAdmin, validate(Joi.object({
  user_ids:   Joi.array().items(Joi.string().uuid()).optional(),
  tier:       Joi.string().valid('bronze','silver','gold','platinum').optional(),
  title_zh:   Joi.string().required(),
  title_en:   Joi.string().required(),
  body_zh:    Joi.string().required(),
  body_en:    Joi.string().required(),
  type:       Joi.string().required(),
})), ctrl.sendPush);

module.exports = router;
