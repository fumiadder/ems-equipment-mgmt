const { InspectionPlan, InspectionRecord } = require('../models');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 巡检计划列表
exports.listPlans = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await InspectionPlan.findAndCountAll({
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

// 创建巡检计划
exports.createPlan = async (req, res, next) => {
  try {
    const plan = await InspectionPlan.create(req.body);
    success(res, plan, '创建成功');
  } catch (err) {
    next(err);
  }
};

// 获取巡检计划详情
exports.getPlanById = async (req, res, next) => {
  try {
    const plan = await InspectionPlan.findByPk(req.params.id, {
      include: [{ model: InspectionRecord, as: 'records', order: [['createdAt', 'DESC']] }]
    });
    if (!plan) return fail(res, '巡检计划不存在', 404);
    success(res, plan);
  } catch (err) {
    next(err);
  }
};

// 更新巡检计划
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await InspectionPlan.findByPk(req.params.id);
    if (!plan) return fail(res, '巡检计划不存在', 404);
    await plan.update(req.body);
    success(res, plan, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 巡检记录列表
exports.listRecords = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, planId, equipmentId, hasAbnormal } = req.query;
    const where = {};
    if (planId) where.planId = planId;
    if (equipmentId) where.equipmentId = equipmentId;
    if (hasAbnormal !== undefined) where.hasAbnormal = hasAbnormal === 'true';

    const { count, rows } = await InspectionRecord.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      include: [
        { model: InspectionPlan, as: 'plan', attributes: ['id', 'name'] },
        { model: require('../models').Equipment, as: 'equipment', attributes: ['id', 'code', 'name'] }
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

// 创建巡检记录
exports.createRecord = async (req, res, next) => {
  try {
    const record = await InspectionRecord.create(req.body);
    success(res, record, '创建成功');
  } catch (err) {
    next(err);
  }
};
