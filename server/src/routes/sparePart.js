const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparePart');

// 备件 CRUD 路由
router.get('/', sparePartController.list);
router.post('/', sparePartController.create);
router.post('/:id/inbound', sparePartController.inbound);
router.post('/:id/outbound', sparePartController.outbound);
router.get('/:id', sparePartController.getById);
router.put('/:id', sparePartController.update);
router.delete('/:id', sparePartController.delete);

module.exports = router;
