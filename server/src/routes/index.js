const express = require('express');
const router = express.Router();

// 路由汇总，所有路由挂载到 /api/v1/
router.use('/equipment', require('./equipment'));
router.use('/work-orders', require('./workOrder'));
router.use('/spare-parts', require('./sparePart'));
router.use('/inspection', require('./inspection'));
router.use('/organizations', require('./organization'));
router.use('/users', require('./user'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
