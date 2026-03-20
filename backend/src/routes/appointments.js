const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/appointmentsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const bookSchema = Joi.object({
  vehicle_id:           Joi.string().uuid().required(),
  appointment_date:     Joi.date().min('now').required(),
  appointment_time:     Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  service_type:         Joi.array().items(Joi.string()).min(1).required(),
  description:          Joi.string().max(1000).optional(),
  customer_notes:       Joi.string().max(500).optional(),
});

router.use(authenticate);

/**
 * @route  GET /api/appointments
 * @desc   获取用户预约列表 Get user appointments
 * @query  status, page, limit
 */
router.get('/', ctrl.getAll);

/**
 * @route  GET /api/appointments/available-slots
 * @desc   获取可用时间段 Get available booking slots
 * @query  date (required)
 */
router.get('/available-slots', ctrl.getAvailableSlots);

/**
 * @route  GET /api/appointments/upcoming
 * @desc   获取即将到来的预约 Get upcoming appointment
 */
router.get('/upcoming', ctrl.getUpcoming);

/**
 * @route  GET /api/appointments/:id
 * @desc   获取预约详情 Get appointment detail
 */
router.get('/:id', ctrl.getOne);

/**
 * @route  POST /api/appointments
 * @desc   创建新预约 Create appointment
 */
router.post('/', validate(bookSchema), ctrl.create);

/**
 * @route  PUT /api/appointments/:id
 * @desc   修改预约 Update appointment (reschedule)
 */
router.put('/:id', validate(bookSchema.fork(
  ['vehicle_id','appointment_date','appointment_time','service_type'],
  s => s.optional()
)), ctrl.update);

/**
 * @route  DELETE /api/appointments/:id/cancel
 * @desc   取消预约 Cancel appointment
 */
router.delete('/:id/cancel', validate(Joi.object({
  reason: Joi.string().max(500).optional()
})), ctrl.cancel);

/**
 * @route  POST /api/appointments/:id/confirm  [Admin]
 * @desc   确认预约 Confirm appointment
 */
router.post('/:id/confirm', isAdmin, ctrl.confirm);

/**
 * @route  POST /api/appointments/:id/complete  [Admin]
 * @desc   标记完成 Mark appointment as completed
 */
router.post('/:id/complete', isAdmin, ctrl.complete);

module.exports = router;
