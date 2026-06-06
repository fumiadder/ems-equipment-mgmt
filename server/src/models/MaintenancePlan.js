const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class MaintenancePlan extends Model {}

MaintenancePlan.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '计划名称'
    },
    equipmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '设备ID'
    },
    cycleType: {
      type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'hours'),
      allowNull: false,
      comment: '周期类型'
    },
    cycleValue: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '周期值'
    },
    lastExecutedAt: {
      type: Sequelize.DATE,
      comment: '上次执行时间'
    },
    nextExecuteAt: {
      type: Sequelize.DATE,
      comment: '下次执行时间'
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: '启用',
      comment: '状态'
    }
  },
  {
    sequelize,
    modelName: 'MaintenancePlan',
    tableName: 'maintenance_plans',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = MaintenancePlan;
