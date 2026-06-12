const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const auth = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/validate');

// 公开路由
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);

// 需要认证的路由
router.get('/me', auth, authController.me);

module.exports = router;
