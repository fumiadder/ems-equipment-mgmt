const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Model } = require('sequelize');

class WorkOrder extends Model {}

WorkOrder.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNo: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '工单编号'
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: '工单标题'
    },
    equipmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: '设备ID'
    },
    faultType: {
      type: Sequelize.STRING,
      comment: '故障类型'
    },
    faultLevel: {
      type: Sequelize.ENUM('P1', 'P2', 'P3'),
      defaultValue: 'P3',
      comment: '故障等级'
    },
    status: {
      type: Sequelize.ENUM('待派单', '已派单', '处理中', '待验收', '已关闭'),
      defaultValue: '待派单',
      comment: '工单状态'
    },
    description: {
      type: Sequelize.TEXT,
      comment: '故障描述'
    },
    assignedTo: {
      type: Sequelize.INTEGER,
      comment: '指派人ID'
    },
    createdBy: {
      type: Sequelize.INTEGER,
      comment: '创建人ID'
    },
    resolvedAt: {
      type: Sequelize.DATE,
      comment: '解决时间'
    },
    closedAt: {
      type: Sequelize.DATE,
      comment: '关闭时间'
    }
  },
  {
    sequelize,
    modelName: 'WorkOrder',
    tableName: 'work_orders',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
);

module.exports = WorkOrder;
