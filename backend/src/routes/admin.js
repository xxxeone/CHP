const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate, isAdmin);

/**
 * @route  GET /api/admin/dashboard
 * @desc   管理后台仪表盘 Admin dashboard stats
 *         Returns: total users, today's appointments, monthly revenue,
 *                  points issued/redeemed, tier distribution
 */
router.get('/dashboard', ctrl.getDashboard);

/**
 * @route  GET /api/admin/appointments/today
 * @desc   今日预约列表 Today's appointments
 */
router.get('/appointments/today', ctrl.getTodayAppointments);

/**
 * @route  GET /api/admin/appointments/calendar
 * @desc   预约日历视图 Appointment calendar view
 * @query  month (YYYY-MM)
 */
router.get('/appointments/calendar', ctrl.getCalendar);

/**
 * @route  GET /api/admin/users/search
 * @desc   搜索用户 Search users
 * @query  q (phone/name/email), tier, page
 */
router.get('/users/search', ctrl.searchUsers);

/**
 * @route  GET /api/admin/reports/revenue
 * @desc   营收报告 Revenue report
 * @query  from, to, groupBy (day|week|month)
 */
router.get('/reports/revenue', ctrl.revenueReport);

/**
 * @route  GET /api/admin/reports/points
 * @desc   积分统计报告 Points statistics report
 */
router.get('/reports/points', ctrl.pointsReport);

/**
 * @route  POST /api/admin/reminders/send
 * @desc   手动触发保养提醒 Manually trigger service reminders
 */
router.post('/reminders/send', ctrl.sendReminders);

/**
 * @route  POST /api/admin/service-records
 * @desc   录入维修记录并自动发放积分
 *         Create service record & auto-award points
 */
router.post('/service-records', ctrl.createServiceRecord);

module.exports = router;
