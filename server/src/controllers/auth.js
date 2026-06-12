const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

// 统一响应格式
const success = (res, data = {}, message = '操作成功') => {
  res.json({ code: 0, data, message });
};

const fail = (res, message = '操作失败', statusCode = 400) => {
  res.status(statusCode).json({ code: 1, data: {}, message });
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return fail(res, '用户名和密码不能为空', 400);
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return fail(res, '用户名或密码错误', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return fail(res, '用户名或密码错误', 401);
    }

    if (user.status !== '启用' && user.status !== 'active') {
      return fail(res, '用户已被禁用', 403);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userData = user.toJSON();
    delete userData.password;

    success(res, { token, user: userData }, '登录成功');
  } catch (err) {
    next(err);
  }
};

// 用户注册
exports.register = async (req, res, next) => {
  try {
    const { username, password, name, email, phone, organizationId } = req.body;

    if (!username || !password || !name) {
      return fail(res, '用户名、密码和姓名不能为空', 400);
    }

    if (password.length < 6) {
      return fail(res, '密码长度不能少于6位', 400);
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return fail(res, '用户名已存在', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      organizationId: organizationId || null,
      status: '启用'
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userData = user.toJSON();
    delete userData.password;

    success(res, { token, user: userData }, '注册成功');
  } catch (err) {
    next(err);
  }
};

// 获取当前用户信息
exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: require('../models').Organization, as: 'organization', attributes: ['id', 'name', 'type'] }
      ]
    });
    if (!user) {
      return fail(res, '用户不存在', 404);
    }
    success(res, user);
  } catch (err) {
    next(err);
  }
};
