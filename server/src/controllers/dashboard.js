const { Equipment, WorkOrder, InspectionRecord, sequelize } = require('../models');
const { Op } = require('sequelize');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

// 仪表盘统计数据
exports.getStats = async (req, res, next) => {
  try {
    // 设备总数
    const totalEquipment = await Equipment.count();

    // 运行中设备数
    const runningEquipment = await Equipment.count({ where: { status: '运行中' } });

    // 待处理工单数
    const pendingOrders = await WorkOrder.count({
      where: { status: ['待派单', '已派单', '处理中'] }
    });

    // 今日巡检数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInspections = await InspectionRecord.count({
      where: { createdAt: { [Op.gte]: today } }
    });

    // 设备状态分布
    const statusDistribution = await Equipment.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    // 工单状态分布
    const orderStatusDistribution = await WorkOrder.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    success(res, {
      totalEquipment,
      runningEquipment,
      pendingOrders,
      todayInspections,
      statusDistribution,
      orderStatusDistribution
    });
  } catch (err) {
    next(err);
  }
};

// 设备状态分布
exports.getEquipmentStatus = async (req, res, next) => {
  try {
    const statusDistribution = await Equipment.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    success(res, statusDistribution);
  } catch (err) {
    next(err);
  }
};

// 最近工单
exports.getRecentWorkOrders = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recentWorkOrders = await WorkOrder.findAll({
      limit,
      order: [['createdAt', 'DESC']]
    });

    success(res, recentWorkOrders);
  } catch (err) {
    next(err);
  }
};

// 最近设备
exports.getRecentEquipments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const recentEquipments = await Equipment.findAll({
      limit,
      order: [['createdAt', 'DESC']]
    });

    success(res, recentEquipments);
  } catch (err) {
    next(err);
  }
};
