const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder');

// 工单 CRUD 路由
router.get('/', workOrderController.list);
router.post('/', workOrderController.create);
router.get('/:id', workOrderController.getById);
router.put('/:id', workOrderController.update);
router.patch('/:id/status', workOrderController.updateStatus);

module.exports = router;
