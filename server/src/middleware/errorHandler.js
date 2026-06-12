// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('[错误]', err.message);

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ code: 1, data: {}, message: messages.join('; ') });
  }

  // Sequelize 唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ code: 1, data: {}, message: messages.join('; ') });
  }

  // Sequelize 外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ code: 1, data: {}, message: '外键约束错误，关联数据不存在' });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ code: 1, data: {}, message: '无效的认证令牌' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ code: 1, data: {}, message: '认证令牌已过期' });
  }

  // 默认服务器错误
  res.status(500).json({ code: 1, data: {}, message: '服务器内部错误' });
};

module.exports = errorHandler;
