const router = require('express').Router();
const Joi = require('joi');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const schemas = {
  register: Joi.object({
    phone:            Joi.string().pattern(/^\+?[\d\s\-]{8,15}$/).required(),
    email:            Joi.string().email().optional(),
    password:         Joi.string().min(8).required(),
    first_name:       Joi.string().min(1).max(100).required(),
    last_name:        Joi.string().min(1).max(100).required(),
    referred_by_code: Joi.string().length(8).optional(),
  }),
  login: Joi.object({
    phone:    Joi.string().required(),
    password: Joi.string().required(),
  }),
  otp: Joi.object({
    phone: Joi.string().required(),
  }),
  verifyOtp: Joi.object({
    phone: Joi.string().required(),
    code:  Joi.string().length(6).required(),
  }),
  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password:     Joi.string().min(8).required(),
  }),
};

/**
 * @route  POST /api/auth/register
 * @desc   新用户注册 Register new user
 * @access Public
 */
router.post('/register', validate(schemas.register), ctrl.register);

/**
 * @route  POST /api/auth/login
 * @desc   手机号+密码登录 Login with phone & password
 * @access Public
 */
router.post('/login', validate(schemas.login), ctrl.login);

/**
 * @route  POST /api/auth/send-otp
 * @desc   发送短信验证码 Send SMS OTP
 * @access Public
 */
router.post('/send-otp', validate(schemas.otp), ctrl.sendOTP);

/**
 * @route  POST /api/auth/verify-otp
 * @desc   验证OTP并登录 Verify OTP and login
 * @access Public
 */
router.post('/verify-otp', validate(schemas.verifyOtp), ctrl.verifyOTP);

/**
 * @route  POST /api/auth/refresh
 * @desc   刷新 JWT token Refresh access token
 * @access Public
 */
router.post('/refresh', ctrl.refreshToken);

/**
 * @route  POST /api/auth/logout
 * @desc   退出登录 Logout
 * @access Private
 */
router.post('/logout', authenticate, ctrl.logout);

/**
 * @route  PUT /api/auth/change-password
 * @desc   修改密码 Change password
 * @access Private
 */
router.put('/change-password', authenticate, validate(schemas.changePassword), ctrl.changePassword);

/**
 * @route  POST /api/auth/forgot-password
 * @desc   忘记密码 Forgot password (sends reset link)
 * @access Public
 */
router.post('/forgot-password', validate(schemas.otp), ctrl.forgotPassword);

module.exports = router;
