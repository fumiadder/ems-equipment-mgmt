const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment');
const { equipmentValidation, idParamValidation } = require('../middleware/validate');

// 设备 CRUD 路由
router.get('/', equipmentController.list);
router.post('/', equipmentValidation, equipmentController.create);
router.get('/:id', idParamValidation, equipmentController.getById);
router.put('/:id', idParamValidation, equipmentValidation, equipmentController.update);
router.delete('/:id', idParamValidation, equipmentController.delete);

module.exports = router;
