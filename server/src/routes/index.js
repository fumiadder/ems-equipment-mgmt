const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// 公开路由
router.use('/auth', require('./auth'));

// 需要认证的路由
router.use('/equipment', auth, require('./equipment'));
router.use('/work-orders', auth, require('./workOrder'));
router.use('/spare-parts', auth, require('./sparePart'));
router.use('/inspection', auth, require('./inspection'));
router.use('/organizations', auth, require('./organization'));
router.use('/users', auth, require('./user'));
router.use('/dashboard', auth, require('./dashboard'));

module.exports = router;
