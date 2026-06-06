const { SparePart } = require('../models');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 备件列表
exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const where = {};

    if (keyword) {
      const { sequelize } = require('../models');
      const { Op } = sequelize;
      where[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await SparePart.findAndCountAll({
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

// 创建备件
exports.create = async (req, res, next) => {
  try {
    const sparePart = await SparePart.create(req.body);
    success(res, sparePart, '创建成功');
  } catch (err) {
    next(err);
  }
};

// 获取备件详情
exports.getById = async (req, res, next) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id);
    if (!sparePart) return fail(res, '备件不存在', 404);
    success(res, sparePart);
  } catch (err) {
    next(err);
  }
};

// 更新备件
exports.update = async (req, res, next) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id);
    if (!sparePart) return fail(res, '备件不存在', 404);
    await sparePart.update(req.body);
    success(res, sparePart, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 删除备件
exports.delete = async (req, res, next) => {
  try {
    const sparePart = await SparePart.findByPk(req.params.id);
    if (!sparePart) return fail(res, '备件不存在', 404);
    await sparePart.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// 备件入库
exports.inbound = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return fail(res, '入库数量必须大于0');

    const sparePart = await SparePart.findByPk(req.params.id);
    if (!sparePart) return fail(res, '备件不存在', 404);

    sparePart.quantity += parseInt(quantity);
    await sparePart.save();
    success(res, sparePart, '入库成功');
  } catch (err) {
    next(err);
  }
};

// 备件出库
exports.outbound = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return fail(res, '出库数量必须大于0');

    const sparePart = await SparePart.findByPk(req.params.id);
    if (!sparePart) return fail(res, '备件不存在', 404);

    if (sparePart.quantity < parseInt(quantity)) {
      return fail(res, '库存不足');
    }

    sparePart.quantity -= parseInt(quantity);
    await sparePart.save();
    success(res, sparePart, '出库成功');
  } catch (err) {
    next(err);
  }
};
