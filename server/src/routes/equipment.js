const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment');

// 设备 CRUD 路由
router.get('/', equipmentController.list);
router.post('/', equipmentController.create);
router.get('/:id', equipmentController.getById);
router.put('/:id', equipmentController.update);
router.delete('/:id', equipmentController.delete);

module.exports = router;
