const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class User extends Model {}

User.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '姓名'
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '密码'
    },
    email: {
      type: Sequelize.STRING,
      comment: '邮箱'
    },
    phone: {
      type: Sequelize.STRING,
      comment: '手机号'
    },
    organizationId: {
      type: Sequelize.INTEGER,
      comment: '所属组织ID'
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: '启用',
      comment: '状态'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = User;
