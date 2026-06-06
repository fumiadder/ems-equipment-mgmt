const { WorkOrder } = require('../models');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 工单列表
exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, faultLevel, equipmentId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (faultLevel) where.faultLevel = faultLevel;
    if (equipmentId) where.equipmentId = equipmentId;

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      include: [
        { model: require('../models').Equipment, as: 'equipment', attributes: ['id', 'code', 'name'] },
        { model: require('../models').User, as: 'assignee', attributes: ['id', 'name'] },
        { model: require('../models').User, as: 'creator', attributes: ['id', 'name'] }
      ]
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

// 创建工单
exports.create = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.create(req.body);
    success(res, workOrder, '创建成功');
  } catch (err) {
    next(err);
  }
};

// 获取工单详情
exports.getById = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id, {
      include: [
        { model: require('../models').Equipment, as: 'equipment' },
        { model: require('../models').User, as: 'assignee', attributes: ['id', 'name'] },
        { model: require('../models').User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });
    if (!workOrder) return fail(res, '工单不存在', 404);
    success(res, workOrder);
  } catch (err) {
    next(err);
  }
};

// 更新工单
exports.update = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) return fail(res, '工单不存在', 404);
    await workOrder.update(req.body);
    success(res, workOrder, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 更新工单状态
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) return fail(res, '工单不存在', 404);

    const updateData = { status };
    if (status === '待验收' || status === '已关闭') {
      updateData.resolvedAt = new Date();
    }
    if (status === '已关闭') {
      updateData.closedAt = new Date();
    }

    await workOrder.update(updateData);
    success(res, workOrder, '状态更新成功');
  } catch (err) {
    next(err);
  }
};
