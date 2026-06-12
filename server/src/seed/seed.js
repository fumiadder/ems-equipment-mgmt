const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { sequelize, Organization, Role, User, Equipment, WorkOrder, SparePart, InspectionPlan, InspectionRecord, MaintenancePlan, LifecycleEvent } = require('../models');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 种子数据脚本
const seed = async () => {
  console.log('开始初始化光伏设备管理系统种子数据...');

  await sequelize.sync({ force: true });
  console.log('数据库表已创建');

  // ========== 组织架构 ==========
  const orgs = await Organization.bulkCreate([
    { id: 1, name: '晶科能源集团', type: '集团', parentId: null, sort: 1 },
    { id: 2, name: '浙江海宁工厂', type: '工厂', parentId: 1, sort: 1 },
    { id: 3, name: '江西上饶工厂', type: '工厂', parentId: 1, sort: 2 },
    { id: 4, name: '海宁-电池片车间', type: '车间', parentId: 2, sort: 1 },
    { id: 5, name: '海宁-组件车间', type: '车间', parentId: 2, sort: 2 },
    { id: 6, name: '上饶-电池片车间', type: '车间', parentId: 3, sort: 1 },
    { id: 7, name: '上饶-组件车间', type: '车间', parentId: 3, sort: 2 },
    { id: 8, name: '电池片A线', type: '产线', parentId: 4, sort: 1 },
    { id: 9, name: '电池片B线', type: '产线', parentId: 4, sort: 2 },
    { id: 10, name: '组件A线', type: '产线', parentId: 5, sort: 1 },
    { id: 11, name: '组件B线', type: '产线', parentId: 5, sort: 2 },
    { id: 12, name: '上饶电池片A线', type: '产线', parentId: 6, sort: 1 },
    { id: 13, name: '上饶组件A线', type: '产线', parentId: 7, sort: 1 }
  ]);
  console.log(`已创建 ${orgs.length} 个组织节点`);

  // ========== 角色 ==========
  const roles = await Role.bulkCreate([
    { id: 1, name: '系统管理员', code: 'admin', description: '系统管理员，拥有所有权限' },
    { id: 2, name: '设备经理', code: 'manager', description: '设备部门经理' },
    { id: 3, name: '设备工程师', code: 'engineer', description: '设备维护工程师' },
    { id: 4, name: '维护技师', code: 'technician', description: '设备维护技师' },
    { id: 5, name: '生产操作员', code: 'operator', description: '产线操作员' },
    { id: 6, name: '巡检员', code: 'inspector', description: '巡检人员' }
  ]);
  console.log(`已创建 ${roles.length} 个角色`);

  // ========== 用户 ==========
  const adminPassword = await bcrypt.hash('admin123', 10);
  const engineerPassword = await bcrypt.hash('123456', 10);
  const users = await User.bulkCreate([
    { id: 1, username: 'admin', name: '系统管理员', password: adminPassword, email: 'admin@jinko.com', phone: '13800000001', organizationId: 1, status: '启用' },
    { id: 2, username: 'manager', name: '李经理', password: engineerPassword, email: 'manager@jinko.com', phone: '13800000002', organizationId: 2, status: '启用' },
    { id: 3, username: 'engineer1', name: '张工程师', password: engineerPassword, email: 'zhang@jinko.com', phone: '13800000003', organizationId: 4, status: '启用' },
    { id: 4, username: 'engineer2', name: '王工程师', password: engineerPassword, email: 'wang@jinko.com', phone: '13800000004', organizationId: 5, status: '启用' },
    { id: 5, username: 'technician1', name: '刘技师', password: engineerPassword, email: 'liu@jinko.com', phone: '13800000005', organizationId: 4, status: '启用' },
    { id: 6, username: 'operator1', name: '赵操作员', password: engineerPassword, email: 'zhao@jinko.com', phone: '13800000006', organizationId: 8, status: '启用' },
    { id: 7, username: 'inspector1', name: '陈巡检员', password: engineerPassword, email: 'chen@jinko.com', phone: '13800000007', organizationId: 2, status: '启用' }
  ]);
  console.log(`已创建 ${users.length} 个用户 (admin/admin123, 其他/123456)`);

  // ========== 光伏设备 ==========
  const equipments = await Equipment.bulkCreate([
    // 海宁-电池片车间
    {
      id: 1, code: 'EQ-HN-DP-001', name: 'RENA制绒机A', model: 'RENA InTex 2.1',
      manufacturer: '德国RENA', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-01号位', type: '制绒设备', status: '运行中',
      params: { processType: '单晶碱制绒', capacity: '8000片/h', bathVolume: '1200L', temperature: '80±2℃' }
    },
    {
      id: 2, code: 'EQ-HN-DP-002', name: '扩散炉A', model: 'Tempress TS8100',
      manufacturer: '荷兰Tempress', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-02号位', type: '扩散设备', status: '运行中',
      params: { tubeCount: 5, maxTemp: '1050℃', throughput: '5000片/h', gasSystem: 'POCl3' }
    },
    {
      id: 3, code: 'EQ-HN-DP-003', name: 'PECVD镀膜机A', model: 'Meyer Burger MAiA 2.1',
      manufacturer: '瑞士Meyer Burger', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-03号位', type: '镀膜设备', status: '运行中',
      params: { process: '管式PECVD', layers: 'SiNx', capacity: '6000片/h', depositionRate: '80nm/min' }
    },
    {
      id: 4, code: 'EQ-HN-DP-004', name: '丝网印刷机A', model: 'Baccini Soft Line',
      manufacturer: '意大利Baccini', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-04号位', type: '印刷设备', status: '运行中',
      params: { printStations: 3, alignment: '±10μm', throughput: '4500片/h', silverPaste: '正面+背面' }
    },
    {
      id: 5, code: 'EQ-HN-DP-005', name: '烧结炉A', model: 'Despatch CF Series',
      manufacturer: '美国Despatch', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-05号位', type: '烧结设备', status: '运行中',
      params: { zones: 9, maxTemp: '900℃', beltSpeed: '100-500cm/min', atmosphere: '空气' }
    },
    {
      id: 6, code: 'EQ-HN-DP-006', name: 'EL测试仪A', model: 'GEL-M6',
      manufacturer: '德国GEL', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-06号位', type: '检测设备', status: '运行中',
      params: { resolution: '12MP', inspectionType: '电致发光', defectDetection: '隐裂/断栅/虚焊' }
    },
    {
      id: 7, code: 'EQ-HN-DP-007', name: 'IV测试分选机A', model: 'halm cetisPV-XF2',
      manufacturer: '德国halm', factory: '浙江海宁工厂', workshop: '电池片车间',
      productionLine: '电池片A线', location: 'A线-07号位', type: '检测设备', status: '运行中',
      params: { flashType: '长脉冲', spectrum: 'AM1.5G', bins: 12, accuracy: '±0.5%' }
    },
    // 海宁-组件车间
    {
      id: 8, code: 'EQ-HN-ZJ-001', name: '串焊机A', model: 'TT-1800',
      manufacturer: '奥特维', factory: '浙江海宁工厂', workshop: '组件车间',
      productionLine: '组件A线', location: 'A线-01号位', type: '焊接设备', status: '运行中',
      params: { cellType: 'MBB', busbars: 9, cycleTime: '2.8s/串', breakingForce: '≥1.5N/mm' }
    },
    {
      id: 9, code: 'EQ-HN-ZJ-002', name: '层压机A', model: 'NPC LM-3600',
      manufacturer: '日本NPC', factory: '浙江海宁工厂', workshop: '组件车间',
      productionLine: '组件A线', location: 'A线-02号位', type: '层压设备', status: '维修中',
      params: { maxPressure: '20T', heatingZones: 4, maxTemp: '160℃', cycleTime: '8min' }
    },
    {
      id: 10, code: 'EQ-HN-ZJ-003', name: 'EL测试仪(组件)A', model: 'GEL-M12',
      manufacturer: '德国GEL', factory: '浙江海宁工厂', workshop: '组件车间',
      productionLine: '组件A线', location: 'A线-03号位', type: '检测设备', status: '运行中',
      params: { resolution: '24MP', componentSize: 'M10/G12', defectDetection: '隐裂/虚焊/断栅' }
    },
    {
      id: 11, code: 'EQ-HN-ZJ-004', name: 'IV测试仪(组件)A', model: 'halm cetisPV-CT',
      manufacturer: '德国halm', factory: '浙江海宁工厂', workshop: '组件车间',
      productionLine: '组件A线', location: 'A线-04号位', type: '检测设备', status: '运行中',
      params: { maxPower: '800W', voltageRange: '0-100V', currentRange: '0-20A' }
    },
    // 上饶-电池片车间
    {
      id: 12, code: 'EQ-SR-DP-001', name: 'RENA制绒机B', model: 'RENA InTex 2.1',
      manufacturer: '德国RENA', factory: '江西上饶工厂', workshop: '电池片车间',
      productionLine: '上饶电池片A线', location: 'A线-01号位', type: '制绒设备', status: '运行中',
      params: { processType: '单晶碱制绒', capacity: '8000片/h', bathVolume: '1200L', temperature: '80±2℃' }
    },
    {
      id: 13, code: 'EQ-SR-DP-002', name: 'PECVD镀膜机B', model: 'Meyer Burger MAiA 2.1',
      manufacturer: '瑞士Meyer Burger', factory: '江西上饶工厂', workshop: '电池片车间',
      productionLine: '上饶电池片A线', location: 'A线-02号位', type: '镀膜设备', status: '待机',
      params: { process: '管式PECVD', layers: 'SiNx', capacity: '6000片/h', depositionRate: '80nm/min' }
    },
    // 辅助设备
    {
      id: 14, code: 'EQ-HN-FZ-001', name: '空压机A', model: 'Atlas GA132',
      manufacturer: '阿特拉斯·科普柯', factory: '浙江海宁工厂', workshop: '辅助车间',
      productionLine: '公用', location: '空压机房-01', type: '辅助设备', status: '运行中',
      params: { power: '132kW', pressure: '0.8MPa', flow: '25m³/min', cooling: '风冷' }
    },
    {
      id: 15, code: 'EQ-HN-FZ-002', name: '冷水机组A', model: 'Carrier 30XW',
      manufacturer: '开利', factory: '浙江海宁工厂', workshop: '辅助车间',
      productionLine: '公用', location: '制冷机房-01', type: '辅助设备', status: '运行中',
      params: { coolingCapacity: '2000kW', refrigerant: 'R134a', COP: '6.2' }
    }
  ]);
  console.log(`已创建 ${equipments.length} 个光伏设备`);

  // ========== 生命周期事件 ==========
  const lifecycleEvents = await LifecycleEvent.bulkCreate([
    { id: 1, equipmentId: 1, fromStatus: '待采购', toStatus: '已采购', operator: '李经理', reason: '从德国RENA采购，合同金额280万欧元' },
    { id: 2, equipmentId: 1, fromStatus: '已采购', toStatus: '运行中', operator: '张工程师', reason: '完成安装调试，验收合格' },
    { id: 3, equipmentId: 1, fromStatus: '运行中', toStatus: '保养中', operator: '刘技师', reason: '年度大保养，更换酸碱管路' },
    { id: 4, equipmentId: 9, fromStatus: '运行中', toStatus: '故障停机', operator: '王工程师', reason: '加热板温度不均匀，导致层压气泡' },
    { id: 5, equipmentId: 9, fromStatus: '故障停机', toStatus: '维修中', operator: '刘技师', reason: '更换加热板加热丝，重新校准温控' }
  ]);
  console.log(`已创建 ${lifecycleEvents.length} 个生命周期事件`);

  // ========== 维护计划 ==========
  const maintenancePlans = await MaintenancePlan.bulkCreate([
    {
      id: 1, equipmentId: 1, name: 'RENA制绒机月度保养',
      cycleType: 'monthly', cycleValue: 1,
      nextExecuteAt: '2024-07-01', status: '启用'
    },
    {
      id: 2, equipmentId: 3, name: 'PECVD季度保养',
      cycleType: 'monthly', cycleValue: 3,
      nextExecuteAt: '2024-07-15', status: '启用'
    },
    {
      id: 3, equipmentId: 8, name: '串焊机周检',
      cycleType: 'weekly', cycleValue: 1,
      nextExecuteAt: '2024-06-17', status: '启用'
    },
    {
      id: 4, equipmentId: 9, name: '层压机年度大修',
      cycleType: 'monthly', cycleValue: 12,
      nextExecuteAt: '2024-12-01', status: '启用'
    }
  ]);
  console.log(`已创建 ${maintenancePlans.length} 个维护计划`);

  // ========== 工单 ==========
  const workOrders = await WorkOrder.bulkCreate([
    {
      id: 1, orderNo: 'WO-202406-0001', title: '层压机A加热板温度不均', equipmentId: 9,
      faultType: '加热系统故障', faultLevel: 'P1', status: '处理中',
      description: '层压机A加热板第3区温度偏低约15℃，导致组件层压后出现气泡，影响产品质量。已停机处理。',
      assignedTo: 3, createdBy: 2, resolvedAt: null, closedAt: null
    },
    {
      id: 2, orderNo: 'WO-202406-0002', title: 'PECVD镀膜机B真空度异常', equipmentId: 13,
      faultType: '真空系统故障', faultLevel: 'P2', status: '已派单',
      description: '真空泵抽速下降，极限真空度从5Pa升至25Pa，影响SiNx薄膜质量。',
      assignedTo: 3, createdBy: 2, resolvedAt: null, closedAt: null
    },
    {
      id: 3, orderNo: 'WO-202406-0003', title: '丝网印刷机A视觉定位偏移', equipmentId: 4,
      faultType: '视觉系统故障', faultLevel: 'P3', status: '待派单',
      description: 'CCD视觉定位系统出现±15μm偏移，超出工艺标准(±10μm)。',
      assignedTo: null, createdBy: 2, resolvedAt: null, closedAt: null
    },
    {
      id: 4, orderNo: 'WO-202406-0004', title: '空压机A油滤堵塞报警', equipmentId: 14,
      faultType: '过滤系统故障', faultLevel: 'P3', status: '已关闭',
      description: '油过滤器压差报警，更换油滤后恢复正常。',
      assignedTo: 5, createdBy: 2, resolvedAt: '2024-06-10 14:30:00', closedAt: '2024-06-10 16:00:00'
    },
    {
      id: 5, orderNo: 'WO-202406-0005', title: 'IV测试仪校准到期', equipmentId: 7,
      faultType: '计量校准', faultLevel: 'P3', status: '待派单',
      description: '标准组件校准证书将于2024-06-30到期，需安排第三方计量机构校准。',
      assignedTo: null, createdBy: 2, resolvedAt: null, closedAt: null
    },
    {
      id: 6, orderNo: 'WO-202406-0006', title: '制绒机A碱槽液位传感器故障', equipmentId: 1,
      faultType: '传感器故障', faultLevel: 'P2', status: '处理中',
      description: 'KOH碱槽液位传感器读数异常，显示液位忽高忽低，已切换至手动补液模式。',
      assignedTo: 3, createdBy: 2, resolvedAt: null, closedAt: null
    }
  ]);
  console.log(`已创建 ${workOrders.length} 个工单`);

  // ========== 备件 ==========
  const spareParts = await SparePart.bulkCreate([
    {
      id: 1, code: 'SP-001', name: '石墨舟', spec: 'PECVD专用-156片',
      applicableModel: 'Meyer Burger MAiA 2.1', quantity: 12, safetyStock: 6,
      unitPrice: 8500.00, supplier: '上海碳素'
    },
    {
      id: 2, code: 'SP-002', name: '加热板加热丝', spec: 'NPC LM-3600专用',
      applicableModel: 'NPC LM-3600', quantity: 2, safetyStock: 2,
      unitPrice: 15000.00, supplier: '日本NPC'
    },
    {
      id: 3, code: 'SP-003', name: '真空泵油', spec: 'Leybold LVO 130-20L',
      applicableModel: '通用', quantity: 8, safetyStock: 4,
      unitPrice: 680.00, supplier: '莱宝真空'
    },
    {
      id: 4, code: 'SP-004', name: '丝网(正面)', spec: '360目-无网结',
      applicableModel: 'Baccini Soft Line', quantity: 50, safetyStock: 20,
      unitPrice: 120.00, supplier: '深圳劲拓'
    },
    {
      id: 5, code: 'SP-005', name: '银浆', spec: '正面银浆-低温固化',
      applicableModel: '通用', quantity: 200, safetyStock: 50,
      unitPrice: 3500.00, supplier: '贺利氏'
    },
    {
      id: 6, code: 'SP-006', name: '密封圈(O型)', spec: 'PECVD炉门-氟橡胶',
      applicableModel: 'Meyer Burger MAiA 2.1', quantity: 30, safetyStock: 10,
      unitPrice: 45.00, supplier: '杜邦'
    },
    {
      id: 7, code: 'SP-007', name: '焊带', spec: 'MBB-0.3x1.2mm-涂锡铜带',
      applicableModel: 'TT-1800', quantity: 500, safetyStock: 100,
      unitPrice: 85.00, supplier: '宇邦新材'
    },
    {
      id: 8, code: 'SP-008', name: 'EVA胶膜', spec: '高透型-0.5mmx1100mm',
      applicableModel: '通用', quantity: 1000, safetyStock: 200,
      unitPrice: 12.50, supplier: '福斯特'
    }
  ]);
  console.log(`已创建 ${spareParts.length} 个备件`);

  // ========== 巡检计划 ==========
  const inspectionPlans = await InspectionPlan.bulkCreate([
    {
      id: 1, name: '电池片车间日常巡检', route: '制绒→扩散→PECVD→丝印→烧结→测试',
      cycleType: 'daily',
      checkItems: [
        { item: '设备运行声音', standard: '无异常噪音、振动正常' },
        { item: '温度/压力参数', standard: '在工艺范围内' },
        { item: '安全防护装置', standard: '急停/防护罩完好' },
        { item: '设备清洁度', standard: '表面无油污杂物' },
        { item: '跑冒滴漏', standard: '无泄漏' }
      ],
      status: '启用'
    },
    {
      id: 2, name: '组件车间周检', route: '串焊→叠层→层压→装框→测试',
      cycleType: 'weekly',
      checkItems: [
        { item: '焊接质量', standard: '无虚焊、脱焊' },
        { item: '层压参数', standard: '温度/压力/时间在设定值' },
        { item: 'EL测试图像', standard: '无隐裂、断栅' },
        { item: 'IV测试数据', standard: '功率/效率正常' }
      ],
      status: '启用'
    },
    {
      id: 3, name: '辅助设备月检', route: '空压机→冷水机→废气处理',
      cycleType: 'monthly',
      checkItems: [
        { item: '空压机压力/温度', standard: '0.7-0.8MPa, <85℃' },
        { item: '冷水机出水温度', standard: '7-12℃' },
        { item: '废气处理塔pH值', standard: '6-9' },
        { item: '能耗数据', standard: '在预算范围内' }
      ],
      status: '启用'
    }
  ]);
  console.log(`已创建 ${inspectionPlans.length} 个巡检计划`);

  // ========== 巡检记录 ==========
  const inspectionRecords = await InspectionRecord.bulkCreate([
    {
      id: 1, planId: 1, equipmentId: 1, inspector: '陈巡检员',
      results: [
        { item: '设备运行声音', result: '正常', pass: true },
        { item: '温度/压力参数', result: '正常', pass: true },
        { item: '安全防护装置', result: '正常', pass: true },
        { item: '设备清洁度', result: '轻微碱液残留', pass: false },
        { item: '跑冒滴漏', result: '正常', pass: true }
      ],
      hasAbnormal: true, abnormalDesc: '设备表面有轻微碱液残留，已通知清理'
    },
    {
      id: 2, planId: 1, equipmentId: 3, inspector: '陈巡检员',
      results: [
        { item: '设备运行声音', result: '正常', pass: true },
        { item: '温度/压力参数', result: '正常', pass: true },
        { item: '安全防护装置', result: '正常', pass: true },
        { item: '设备清洁度', result: '正常', pass: true },
        { item: '跑冒滴漏', result: '正常', pass: true }
      ],
      hasAbnormal: false, abnormalDesc: null
    },
    {
      id: 3, planId: 2, equipmentId: 9, inspector: '陈巡检员',
      results: [
        { item: '焊接质量', result: '正常', pass: true },
        { item: '层压参数', result: '温度偏低', pass: false },
        { item: 'EL测试图像', result: '气泡', pass: false },
        { item: 'IV测试数据', result: '功率偏低', pass: false }
      ],
      hasAbnormal: true, abnormalDesc: '层压机加热板温度不均，已报修WO-202406-0001'
    },
    {
      id: 4, planId: 3, equipmentId: 14, inspector: '陈巡检员',
      results: [
        { item: '空压机压力/温度', result: '正常', pass: true },
        { item: '冷水机出水温度', result: '正常', pass: true },
        { item: '废气处理塔pH值', result: '正常', pass: true },
        { item: '能耗数据', result: '正常', pass: true }
      ],
      hasAbnormal: false, abnormalDesc: null
    }
  ]);
  console.log(`已创建 ${inspectionRecords.length} 条巡检记录`);

  console.log('\n========================================');
  console.log('  光伏设备管理系统种子数据初始化完成!');
  console.log('========================================');
  console.log('  默认用户:');
  console.log('    admin / admin123 (系统管理员)');
  console.log('    manager / 123456 (设备经理)');
  console.log('    engineer1 / 123456 (设备工程师)');
  console.log('    technician1 / 123456 (维护技师)');
  console.log('    operator1 / 123456 (操作员)');
  console.log('    inspector1 / 123456 (巡检员)');
  console.log('========================================');
  process.exit(0);
};

seed().catch(err => {
  console.error('种子数据初始化失败:', err);
  process.exit(1);
});
