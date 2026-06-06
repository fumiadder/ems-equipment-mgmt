const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class SparePart extends Model {}

SparePart.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '备件编码'
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '备件名称'
    },
    spec: {
      type: Sequelize.STRING,
      comment: '规格型号'
    },
    applicableModel: {
      type: Sequelize.STRING,
      comment: '适用机型'
    },
    quantity: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '库存数量'
    },
    safetyStock: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '安全库存'
    },
    unitPrice: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
      comment: '单价'
    },
    supplier: {
      type: Sequelize.STRING,
      comment: '供应商'
    }
  },
  {
    sequelize,
    modelName: 'SparePart',
    tableName: 'spare_parts',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = SparePart;
