const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/vehiclesController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const vehicleSchema = Joi.object({
  nickname:      Joi.string().max(100).optional(),
  make:          Joi.string().max(100).required(),
  model:         Joi.string().max(100).required(),
  year:          Joi.number().integer().min(1990).max(2030).required(),
  color:         Joi.string().max(50).optional(),
  license_plate: Joi.string().max(20).optional(),
  vin:           Joi.string().length(17).optional(),
  fuel_type:     Joi.string().valid('gasoline','diesel','electric','hybrid','other').optional(),
  transmission:  Joi.string().valid('automatic','manual','cvt','other').optional(),
  engine_size:   Joi.string().max(20).optional(),
  mileage:       Joi.number().integer().min(0).optional(),
  is_primary:    Joi.boolean().optional(),
  notes:         Joi.string().max(500).optional(),
});

// All routes require authentication
router.use(authenticate);

/**
 * @route  GET /api/vehicles
 * @desc   获取用户所有车辆 Get all user vehicles
 */
router.get('/', ctrl.getAll);

/**
 * @route  GET /api/vehicles/:id
 * @desc   获取车辆详情 Get vehicle detail
 */
router.get('/:id', ctrl.getOne);

/**
 * @route  POST /api/vehicles
 * @desc   添加新车辆 Add new vehicle
 */
router.post('/', validate(vehicleSchema), ctrl.create);

/**
 * @route  PUT /api/vehicles/:id
 * @desc   更新车辆信息 Update vehicle
 */
router.put('/:id', validate(vehicleSchema.fork(['make','model','year'], s => s.optional())), ctrl.update);

/**
 * @route  DELETE /api/vehicles/:id
 * @desc   删除车辆 Delete vehicle
 */
router.delete('/:id', ctrl.remove);

/**
 * @route  PUT /api/vehicles/:id/primary
 * @desc   设为主要车辆 Set as primary vehicle
 */
router.put('/:id/primary', ctrl.setPrimary);

/**
 * @route  GET /api/vehicles/:id/service-history
 * @desc   获取车辆维修历史 Get vehicle service history
 */
router.get('/:id/service-history', ctrl.getServiceHistory);

/**
 * @route  PUT /api/vehicles/:id/mileage
 * @desc   更新里程数 Update mileage
 */
router.put('/:id/mileage', validate(Joi.object({ mileage: Joi.number().integer().min(0).required() })), ctrl.updateMileage);

module.exports = router;
