const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class InspectionRecord extends Model {}

InspectionRecord.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    planId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '巡检计划ID'
    },
    equipmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '设备ID'
    },
    inspector: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '巡检人'
    },
    results: {
      type: Sequelize.JSON,
      comment: '巡检结果(JSON)'
    },
    hasAbnormal: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: '是否有异常'
    },
    abnormalDesc: {
      type: Sequelize.TEXT,
      comment: '异常描述'
    }
  },
  {
    sequelize,
    modelName: 'InspectionRecord',
    tableName: 'inspection_records',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
  }
);

module.exports = InspectionRecord;
