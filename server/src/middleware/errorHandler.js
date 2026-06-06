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

  // 默认服务器错误
  res.status(500).json({ code: 1, data: {}, message: '服务器内部错误' });
};

module.exports = errorHandler;
