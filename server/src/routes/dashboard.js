const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');

// 仪表盘路由
router.get('/stats', dashboardController.getStats);
router.get('/equipment-status', dashboardController.getEquipmentStatus);
router.get('/recent-work-orders', dashboardController.getRecentWorkOrders);
router.get('/recent-equipments', dashboardController.getRecentEquipments);

module.exports = router;
