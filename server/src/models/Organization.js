const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class Organization extends Model {}

Organization.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '组织名称'
    },
    type: {
      type: Sequelize.ENUM('集团', '工厂', '车间', '产线'),
      allowNull: false,
      comment: '组织类型'
    },
    parentId: {
      type: Sequelize.INTEGER,
      defaultValue: null,
      comment: '父组织ID'
    },
    sort: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: '排序'
    }
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = Organization;
