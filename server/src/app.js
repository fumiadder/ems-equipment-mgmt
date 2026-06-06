const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date() }, message: '服务正常' });
});

// 路由挂载
app.use('/api/v1', routes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: 1, data: {}, message: '接口不存在' });
});

// 全局错误处理
app.use(errorHandler);

// 启动服务
const PORT = process.env.PORT || 3001;

sequelize.sync().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`设备管理系统后端服务已启动: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库同步失败:', err);
  process.exit(1);
});

module.exports = app;
