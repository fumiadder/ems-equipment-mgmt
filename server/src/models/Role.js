const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class Role extends Model {}

Role.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '角色名称'
    },
    code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: '角色编码'
    },
    description: {
      type: Sequelize.STRING,
      comment: '描述'
    }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
  }
);

module.exports = Role;
