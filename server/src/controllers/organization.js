const { Organization } = require('../models');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 获取组织架构树
exports.tree = async (req, res, next) => {
  try {
    const allOrgs = await Organization.findAll({
      order: [['sort', 'ASC'], ['id', 'ASC']]
    });

    // 构建树形结构
    const map = {};
    const tree = [];
    allOrgs.forEach(org => {
      map[org.id] = { ...org.toJSON(), children: [] };
    });
    allOrgs.forEach(org => {
      if (org.parentId && map[org.parentId]) {
        map[org.parentId].children.push(map[org.id]);
      } else {
        tree.push(map[org.id]);
      }
    });

    success(res, tree);
  } catch (err) {
    next(err);
  }
};

// 组织列表（平铺）
exports.list = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = {};
    if (type) where.type = type;

    const list = await Organization.findAll({
      where,
      order: [['sort', 'ASC'], ['id', 'ASC']]
    });

    success(res, list);
  } catch (err) {
    next(err);
  }
};

// 创建组织
exports.create = async (req, res, next) => {
  try {
    const org = await Organization.create(req.body);
    success(res, org, '创建成功');
  } catch (err) {
    next(err);
  }
};

// 更新组织
exports.update = async (req, res, next) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return fail(res, '组织不存在', 404);
    await org.update(req.body);
    success(res, org, '更新成功');
  } catch (err) {
    next(err);
  }
};

// 删除组织
exports.delete = async (req, res, next) => {
  try {
    const org = await Organization.findByPk(req.params.id);
    if (!org) return fail(res, '组织不存在', 404);

    // 检查是否有子组织
    const children = await Organization.count({ where: { parentId: org.id } });
    if (children > 0) return fail(res, '存在子组织，无法删除');

    await org.destroy();
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};
