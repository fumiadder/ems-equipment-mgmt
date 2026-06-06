const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspection');

// 巡检计划路由
router.get('/plans', inspectionController.listPlans);
router.post('/plans', inspectionController.createPlan);
router.get('/plans/:id', inspectionController.getPlanById);
router.put('/plans/:id', inspectionController.updatePlan);

// 巡检记录路由
router.get('/records', inspectionController.listRecords);
router.post('/records', inspectionController.createRecord);

module.exports = router;
