const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

// 用户 CRUD 路由
router.get('/', userController.list);
router.post('/', userController.create);
router.post('/:id/reset-password', userController.resetPassword);
router.patch('/:id/status', userController.toggleStatus);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
