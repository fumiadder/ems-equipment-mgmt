const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { sequelize, Organization, Role, User, Equipment, WorkOrder, SparePart, InspectionPlan, InspectionRecord } = require('../models');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 种子数据脚本
const seed = async () => {
  console.log('开始初始化种子数据...');

  await sequelize.sync({ force: true });
  console.log('数据库表已创建');

  // ========== 组织架构 ==========
  // 1个集团 -> 2个工厂 -> 4个车间 -> 8个产线
  const orgs = await Organization.bulkCreate([
    { id: 1, name: '华东制造集团', type: '集团', parentId: null, sort: 1 },
    { id: 2, name: '上海工厂', type: '工厂', parentId: 1, sort: 1 },
    { id: 3, name: '苏州工厂', type: '工厂', parentId: 1, sort: 2 },
    { id: 4, name: '上海工厂-冲压车间', type: '车间', parentId: 2, sort: 1 },
    { id: 5, name: '上海工厂-焊接车间', type: '车间', parentId: 2, sort: 2 },
    { id: 6, name: '苏州工厂-装配车间', type: '车间', parentId: 3, sort: 1 },
    { id: 7, name: '苏州工厂-涂装车间', type: '车间', parentId: 3, sort: 2 },
    { id: 8, name: '冲压车间-A线', type: '产线', parentId: 4, sort: 1 },
    { id: 9, name: '冲压车间-B线', type: '产线', parentId: 4, sort: 2 },
    { id: 10, name: '焊接车间-A线', type: '产线', parentId: 5, sort: 1 },
    { id: 11, name: '焊接车间-B线', type: '产线', parentId: 5, sort: 2 },
    { id: 12, name: '装配车间-A线', type: '产线', parentId: 6, sort: 1 },
    { id: 13, name: '装配车间-B线', type: '产线', parentId: 6, sort: 2 },
    { id: 14, name: '涂装车间-A线', type: '产线', parentId: 7, sort: 1 },
    { id: 15, name: '涂装车间-B线', type: '产线', parentId: 7, sort: 2 }
  ]);
  console.log(`已创建 ${orgs.length} 个组织节点`);

  // ========== 角色 ==========
  const roles = await Role.bulkCreate([
    { id: 1, name: '系统管理员', code: 'admin', description: '系统管理员，拥有所有权限' },
    { id: 2, name: '设备工程师', code: 'engineer', description: '设备维护工程师' },
    { id: 3, name: '操作员', code: 'operator', description: '产线操作员' },
    { id: 4, name: '巡检员', code: 'inspector', description: '巡检人员' }
  ]);
  console.log(`已创建 ${roles.length} 个角色`);

  // ========== 用户 ==========
  const adminPassword = await bcrypt.hash('123456', 10);
  const engineerPassword = await bcrypt.hash('123456', 10);
  const users = await User.bulkCreate([
    { id: 1, username: 'admin', name: '系统管理员', password: adminPassword, email: 'admin@ems.com', phone: '13800000001', organizationId: 1, status: '启用' },
    { id: 2, username: 'engineer', name: '张工程师', password: engineerPassword, email: 'engineer@ems.com', phone: '13800000002', organizationId: 4, status: '启用' }
  ]);
  console.log(`已创建 ${users.length} 个用户 (admin/123456, engineer/123456)`);

  // ========== 示例设备 ==========
  const equipments = await Equipment.bulkCreate([
    {
      id: 1, code: 'EQ-SH-CY-001', name: '数控冲压机A', model: 'CNC-800T',
      manufacturer: '济南二机床', factory: '上海工厂', workshop: '冲压车间',
      productionLine: 'A线', location: 'A线-01号位', type: '冲压设备', status: '运行中',
      params: { ratedForce: '800T', tableSize: '2500x1250mm', strokeCount: '15-30spm' }
    },
    {
      id: 2, code: 'EQ-SH-CY-002', name: '液压冲压机B', model: 'HYD-600T',
      manufacturer: '徐州锻压', factory: '上海工厂', workshop: '冲压车间',
      productionLine: 'B线', location: 'B线-01号位', type: '冲压设备', status: '运行中',
      params: { ratedForce: '600T', tableSize: '2000x1000mm', strokeCount: '10-25spm' }
    },
    {
      id: 3, code: 'EQ-SH-HJ-001', name: '焊接机器人A', model: 'FANUC-R2000',
      manufacturer: '发那科', factory: '上海工厂', workshop: '焊接车间',
      productionLine: 'A线', location: 'A线-01号位', type: '焊接设备', status: '运行中',
      params: { armLength: '2000mm', payload: '200kg', axes: 6 }
    },
    {
      id: 4, code: 'EQ-SZ-ZP-001', name: '自动装配线', model: 'ASM-LINE-01',
      manufacturer: '西门子', factory: '苏州工厂', workshop: '装配车间',
      productionLine: 'A线', location: 'A线-01号位', type: '装配设备', status: '运行中',
      params: { stations: 12, cycleTime: '45s/件', capacity: '80件/h' }
    },
    {
      id: 5, code: 'EQ-SZ-TZ-001', name: '静电喷涂设备', model: 'ES-500',
      manufacturer: 'ABB', factory: '苏州工厂', workshop: '涂装车间',
      productionLine: 'A线', location: 'A线-01号位', type: '涂装设备', status: '维修中',
      params: { sprayType: '静电', nozzleCount: 8, pressure: '0.3-0.5MPa' }
    }
  ]);
  console.log(`已创建 ${equipments.length} 个示例设备`);

  // ========== 工单 ==========
  const workOrders = await WorkOrder.bulkCreate([
    {
      id: 1, orderNo: 'WO-2024-0001', title: '数控冲压机A主轴异响', equipmentId: 1,
      faultType: '机械故障', faultLevel: 'P2', status: '处理中',
      description: '运行过程中主轴出现间歇性异响，需停机检查轴承磨损情况',
      assignedTo: 2, createdBy: 1
    },
    {
      id: 2, orderNo: 'WO-2024-0002', title: '焊接机器人A焊枪磨损', equipmentId: 3,
      faultType: '部件磨损', faultLevel: 'P3', status: '待派单',
      description: '焊枪导电嘴磨损严重，需更换',
      assignedTo: null, createdBy: 1
    },
    {
      id: 3, orderNo: 'WO-2024-0003', title: '静电喷涂设备喷嘴堵塞', equipmentId: 5,
      faultType: '管路堵塞', faultLevel: 'P1', status: '已派单',
      description: '多个喷嘴堵塞导致喷涂不均匀，影响产品质量',
      assignedTo: 2, createdBy: 1
    }
  ]);
  console.log(`已创建 ${workOrders.length} 个工单`);

  // ========== 备件 ==========
  const spareParts = await SparePart.bulkCreate([
    {
      id: 1, code: 'SP-001', name: '主轴轴承', spec: 'SKF 7218B',
      applicableModel: 'CNC-800T', quantity: 5, safetyStock: 2,
      unitPrice: 2800.00, supplier: '斯凯孚轴承'
    },
    {
      id: 2, code: 'SP-002', name: '焊枪导电嘴', spec: 'CK-200-15',
      applicableModel: 'FANUC-R2000', quantity: 20, safetyStock: 10,
      unitPrice: 45.00, supplier: '林肯电气'
    },
    {
      id: 3, code: 'SP-003', name: '喷嘴组件', spec: 'ES-NOZZLE-08',
      applicableModel: 'ES-500', quantity: 8, safetyStock: 4,
      unitPrice: 320.00, supplier: 'ABB喷涂配件'
    }
  ]);
  console.log(`已创建 ${spareParts.length} 个备件`);

  // ========== 巡检计划 ==========
  const inspectionPlans = await InspectionPlan.bulkCreate([
    {
      id: 1, name: '冲压车间日常巡检', route: '冲压车间A线->B线',
      cycleType: 'daily',
      checkItems: [
        { item: '设备运行声音', standard: '无异常噪音' },
        { item: '液压油位', standard: '油位在正常范围内' },
        { item: '安全防护装置', standard: '完好有效' },
        { item: '设备清洁度', standard: '表面无油污杂物' }
      ],
      status: '启用'
    },
    {
      id: 2, name: '焊接车间周检', route: '焊接车间A线->B线',
      cycleType: 'weekly',
      checkItems: [
        { item: '焊枪状态', standard: '导电嘴无磨损、保护气正常' },
        { item: '冷却水系统', standard: '流量正常、无泄漏' },
        { item: '机器人精度', standard: '重复定位精度合格' },
        { item: '接地保护', standard: '接地电阻<4Ω' }
      ],
      status: '启用'
    }
  ]);
  console.log(`已创建 ${inspectionPlans.length} 个巡检计划`);

  // ========== 巡检记录 ==========
  const inspectionRecords = await InspectionRecord.bulkCreate([
    {
      id: 1, planId: 1, equipmentId: 1, inspector: '张工程师',
      results: [
        { item: '设备运行声音', result: '正常', pass: true },
        { item: '液压油位', result: '正常', pass: true },
        { item: '安全防护装置', result: '正常', pass: true },
        { item: '设备清洁度', result: '轻微油污', pass: false }
      ],
      hasAbnormal: true, abnormalDesc: '设备表面有轻微油污，建议清理'
    },
    {
      id: 2, planId: 2, equipmentId: 3, inspector: '张工程师',
      results: [
        { item: '焊枪状态', result: '正常', pass: true },
        { item: '冷却水系统', result: '正常', pass: true },
        { item: '机器人精度', result: '合格', pass: true },
        { item: '接地保护', result: '合格', pass: true }
      ],
      hasAbnormal: false, abnormalDesc: null
    }
  ]);
  console.log(`已创建 ${inspectionRecords.length} 条巡检记录`);

  console.log('\n种子数据初始化完成!');
  console.log('默认用户: admin/123456, engineer/123456');
  process.exit(0);
};

seed().catch(err => {
  console.error('种子数据初始化失败:', err);
  process.exit(1);
});
