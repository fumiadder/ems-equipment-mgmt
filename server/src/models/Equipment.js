const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class Equipment extends Model {}

Equipment.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '设备编码'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '设备名称'
    },
    model: {
      type: Sequelize.STRING,
      comment: '设备型号'
    },
    manufacturer: {
      type: Sequelize.STRING,
      comment: '制造商'
    },
    factory: {
      type: Sequelize.STRING,
      comment: '所属工厂'
    },
    workshop: {
      type: Sequelize.STRING,
      comment: '所属车间'
    },
    productionLine: {
      type: Sequelize.STRING,
      comment: '所属产线'
    },
    location: {
      type: Sequelize.STRING,
      comment: '安装位置'
    },
    type: {
      type: Sequelize.STRING,
      comment: '设备类型'
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: '运行中',
      comment: '设备状态'
    },
    params: {
      type: Sequelize.JSON,
      comment: '设备参数(JSON)'
    },
    parentId: {
      type: Sequelize.INTEGER,
      comment: '父设备ID'
    }
  },
  {
    sequelize,
    modelName: 'Equipment',
    tableName: 'equipments',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = Equipment;
