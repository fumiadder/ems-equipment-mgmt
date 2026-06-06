const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization');

// 组织架构路由
router.get('/tree', organizationController.tree);
router.get('/', organizationController.list);
router.post('/', organizationController.create);
router.put('/:id', organizationController.update);
router.delete('/:id', organizationController.delete);

module.exports = router;
