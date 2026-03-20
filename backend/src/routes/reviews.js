const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/reviewsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const reviewSchema = Joi.object({
  record_id:      Joi.string().uuid().required(),
  overall_rating: Joi.number().integer().min(1).max(5).required(),
  service_rating: Joi.number().integer().min(1).max(5).optional(),
  price_rating:   Joi.number().integer().min(1).max(5).optional(),
  speed_rating:   Joi.number().integer().min(1).max(5).optional(),
  comment:        Joi.string().max(2000).optional(),
  is_anonymous:   Joi.boolean().optional(),
});

/**
 * @route  GET /api/reviews
 * @desc   获取已发布评价 Get published reviews
 * @query  rating, page, limit
 * @access Public
 */
router.get('/', ctrl.getPublished);

/**
 * @route  GET /api/reviews/my
 * @desc   获取我的评价 Get my reviews
 * @access Private
 */
router.get('/my', authenticate, ctrl.getMy);

/**
 * @route  POST /api/reviews
 * @desc   提交评价 Submit review (earns 50 points)
 * @access Private
 */
router.post('/', authenticate, validate(reviewSchema), ctrl.create);

/**
 * @route  PUT /api/reviews/:id  [Admin]
 * @desc   审核并发布评价 Approve/publish review
 * @access Admin
 */
router.put('/:id/publish', authenticate, isAdmin, ctrl.publish);

module.exports = router;
