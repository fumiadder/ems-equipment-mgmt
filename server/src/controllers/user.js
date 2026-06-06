const { User } = require('../models');
const bcrypt = require('bcryptjs');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 用户列表
exports.list = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, status, organizationId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (organizationId) where.organizationId = organizationId;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['createdAt', 'DESC']],
      include: [
        { model: require('../models').Organization, as: 'organization', attributes: ['id', 'name', 'type'] }
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

// 创建用户
exports.create = async (req, res, next) => {
  try {
    const { password, ...data } = req.body;
    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    const user = await User.create({ ...data, password: hashedPassword });
    const result = user.toJSON();
    delete result.password;
    success(res, result, '创建成功');
  } catch (err) {
    next(err);
  }
};

// 获取用户详情
exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: require('../models').Organization, as: 'organization', attributes: ['id', 'name', 'type'] }
      ]
    });
    if (!user) return fail(res, '用户不存在', 404);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

// 更新用户
exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, '用户不存在', 404);

    const { password, ...data } = req.body;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    await user.update(data);
    const result = user.toJSON();
    delete result.password;
    success(res, result, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 删除用户
exports.delete = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, '用户不存在', 404);
    await user.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// 重置密码
exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, '用户不存在', 404);

    const hashedPassword = await bcrypt.hash('123456', 10);
    await user.update({ password: hashedPassword });
    success(res, null, '密码已重置为123456');
  } catch (err) {
    next(err);
  }
};

// 切换用户状态
exports.toggleStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return fail(res, '用户不存在', 404);

    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    await user.update({ status: newStatus });
    const result = user.toJSON();
    delete result.password;
    success(res, result, `用户状态已切换为${newStatus === 'active' ? '启用' : '禁用'}`);
  } catch (err) {
    next(err);
  }
};
