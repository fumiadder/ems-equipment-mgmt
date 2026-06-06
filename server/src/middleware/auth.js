const jwt = require('jsonwebtoken');

// JWT 密钥
const JWT_SECRET = 'ems-server-secret-key-2024';

// JWT 认证中间件，从 header 提取 token 验证
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, data: {}, message: '未提供认证令牌' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 1, data: {}, message: '令牌无效或已过期' });
  }
};

module.exports = auth;
module.exports.JWT_SECRET = JWT_SECRET;
