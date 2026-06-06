const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class LifecycleEvent extends Model {}

LifecycleEvent.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    equipmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '设备ID'
    },
    fromStatus: {
      type: Sequelize.STRING,
      comment: '变更前状态'
    },
    toStatus: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '变更后状态'
    },
    operator: {
      type: Sequelize.STRING,
      comment: '操作人'
    },
    reason: {
      type: Sequelize.STRING,
      comment: '变更原因'
    }
  },
  {
    sequelize,
    modelName: 'LifecycleEvent',
    tableName: 'lifecycle_events',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
  }
);

module.exports = LifecycleEvent;
