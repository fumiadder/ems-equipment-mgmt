const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class InspectionPlan extends Model {}

InspectionPlan.init(
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
    route: {
      type: Sequelize.STRING,
      comment: '巡检路线'
    },
    cycleType: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '周期类型'
    },
    checkItems: {
      type: Sequelize.JSON,
      comment: '检查项(JSON)'
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: '启用',
      comment: '状态'
    }
  },
  {
    sequelize,
    modelName: 'InspectionPlan',
    tableName: 'inspection_plans',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = InspectionPlan;
