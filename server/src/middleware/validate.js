const { body, param, validationResult } = require('express-validator');

// 统一处理校验结果
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 1,
      data: {},
      message: errors.array().map(e => e.msg).join('; ')
    });
  }
  next();
};

// 登录校验规则
const loginValidation = [
  body('username').notEmpty().withMessage('用户名不能为空').trim(),
  body('password').notEmpty().withMessage('密码不能为空'),
  handleValidationErrors
];

// 注册校验规则
const registerValidation = [
  body('username').notEmpty().withMessage('用户名不能为空').trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20之间'),
  body('password').notEmpty().withMessage('密码不能为空').isLength({ min: 6 }).withMessage('密码长度不能少于6位'),
  body('name').notEmpty().withMessage('姓名不能为空').trim(),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  handleValidationErrors
];

// 设备创建/更新校验规则
const equipmentValidation = [
  body('code').notEmpty().withMessage('设备编码不能为空').trim(),
  body('name').notEmpty().withMessage('设备名称不能为空').trim(),
  body('type').notEmpty().withMessage('设备类型不能为空').trim(),
  handleValidationErrors
];

// ID 参数校验
const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID必须是正整数'),
  handleValidationErrors
];

module.exports = {
  loginValidation,
  registerValidation,
  equipmentValidation,
  idParamValidation,
  handleValidationErrors
};
