const { Equipment, LifecycleEvent, sequelize } = require('../models');
const { Op } = sequelize;

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 设备列表（支持分页和筛选）
exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, factory, workshop, type, status, keyword } = req.query;
    const where = {};

    if (factory) where.factory = factory;
    if (workshop) where.workshop = workshop;
    if (type) where.type = type;
    if (status) where.status = status;
    if (keyword) {
      where[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Equipment.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });

    success(res, {
      list: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count
      }
    });
  } catch (err) {
    next(err);
  }
};

// 创建设备
exports.create = async (req, res, next) => {
  try {
    const equipment = await Equipment.create(req.body);
    success(res, equipment, '创建成功');
  } catch (err) {
    next(err);
  }
};

// 获取设备详情
exports.getById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [
        { model: LifecycleEvent, as: 'lifecycleEvents', order: [['createdAt', 'DESC']] }
      ]
    });
    if (!equipment) return fail(res, '设备不存在', 404);
    success(res, equipment);
  } catch (err) {
    next(err);
  }
};

// 更新设备
exports.update = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) return fail(res, '设备不存在', 404);

    // 如果状态变更，记录生命周期事件
    if (req.body.status && req.body.status !== equipment.status) {
      await LifecycleEvent.create({
        equipmentId: equipment.id,
        fromStatus: equipment.status,
        toStatus: req.body.status,
        operator: req.body.operator || 'system',
        reason: req.body.reason || ''
      });
    }

    await equipment.update(req.body);
    success(res, equipment, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 删除设备
exports.delete = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) return fail(res, '设备不存在', 404);
    await equipment.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};
