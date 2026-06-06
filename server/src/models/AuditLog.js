const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '操作用户ID'
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '操作类型'
    },
    target: {
      type: Sequelize.STRING,
      comment: '操作目标'
    },
    detail: {
      type: Sequelize.TEXT,
      comment: '操作详情'
    },
    ip: {
      type: Sequelize.STRING,
      comment: 'IP地址'
    }
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
  }
);

module.exports = AuditLog;
