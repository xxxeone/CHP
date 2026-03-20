const router = require('express').Router();
const ctrl = require('../controllers/servicesController');
const { authenticate, isAdmin } = require('../middleware/auth');

/**
 * @route  GET /api/services
 * @desc   获取所有服务分类和项目 Get all service categories & items
 * @access Public
 */
router.get('/', ctrl.getAll);

/**
 * @route  GET /api/services/categories
 * @desc   获取服务分类 Get service categories
 * @access Public
 */
router.get('/categories', ctrl.getCategories);

/**
 * @route  GET /api/services/:id
 * @desc   获取服务详情 Get service detail
 * @access Public
 */
router.get('/:id', ctrl.getOne);

/**
 * @route  GET /api/services/records/my
 * @desc   获取我的维修记录 Get my service records
 * @access Private
 */
router.get('/records/my', authenticate, ctrl.getMyRecords);

/**
 * @route  GET /api/services/records/:id
 * @desc   获取维修记录详情 Get service record detail
 * @access Private
 */
router.get('/records/:id', authenticate, ctrl.getRecordDetail);

/**
 * @route  POST /api/services/records  [Admin]
 * @desc   创建维修记录 Create service record (admin: after service completion)
 * @access Admin
 */
router.post('/records', authenticate, isAdmin, ctrl.createRecord);

module.exports = router;
