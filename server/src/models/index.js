const sequelize = require('../config/database');

// 导入所有模型
const Equipment = require('./Equipment');
const LifecycleEvent = require('./LifecycleEvent');
const WorkOrder = require('./WorkOrder');
const MaintenancePlan = require('./MaintenancePlan');
const SparePart = require('./SparePart');
const InspectionPlan = require('./InspectionPlan');
const InspectionRecord = require('./InspectionRecord');
const Organization = require('./Organization');
const User = require('./User');
const Role = require('./Role');
const AuditLog = require('./AuditLog');

// 定义模型关联
Equipment.hasMany(LifecycleEvent, { foreignKey: 'equipmentId', as: 'lifecycleEvents' });
LifecycleEvent.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

Equipment.hasMany(WorkOrder, { foreignKey: 'equipmentId', as: 'workOrders' });
WorkOrder.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

Equipment.hasMany(MaintenancePlan, { foreignKey: 'equipmentId', as: 'maintenancePlans' });
MaintenancePlan.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

InspectionPlan.hasMany(InspectionRecord, { foreignKey: 'planId', as: 'records' });
InspectionRecord.belongsTo(InspectionPlan, { foreignKey: 'planId', as: 'plan' });

Equipment.hasMany(InspectionRecord, { foreignKey: 'equipmentId', as: 'inspectionRecords' });
InspectionRecord.belongsTo(Equipment, { foreignKey: 'equipmentId', as: 'equipment' });

Organization.hasMany(Organization, { foreignKey: 'parentId', as: 'children' });
Organization.belongsTo(Organization, { foreignKey: 'parentId', as: 'parent' });

User.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Organization.hasMany(User, { foreignKey: 'organizationId', as: 'users' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

WorkOrder.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
WorkOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  Equipment,
  LifecycleEvent,
  WorkOrder,
  MaintenancePlan,
  SparePart,
  InspectionPlan,
  InspectionRecord,
  Organization,
  User,
  Role,
  AuditLog
};
