const { Sequelize } = require('sequelize');
const path = require('path');

// Sequelize SQLite 配置，数据库文件存储到 ./data/database.sqlite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'data', 'database.sqlite'),
  logging: false
});

module.exports = sequelize;
