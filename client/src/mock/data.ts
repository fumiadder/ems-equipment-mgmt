/**
 * Mock seed data for EMS Equipment Management System
 * Matches the exact data from backend seed.js
 */

/* ========== 组织架构 ========== */
export interface Organization {
  id: number;
  name: string;
  type: '集团' | '工厂' | '车间' | '产线';
  parentId: number | null;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export const seedOrganizations: Organization[] = [
  { id: 1, name: '华东制造集团', type: '集团', parentId: null, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: '上海工厂', type: '工厂', parentId: 1, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, name: '苏州工厂', type: '工厂', parentId: 1, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 4, name: '上海工厂-冲压车间', type: '车间', parentId: 2, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 5, name: '上海工厂-焊接车间', type: '车间', parentId: 2, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 6, name: '苏州工厂-装配车间', type: '车间', parentId: 3, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 7, name: '苏州工厂-涂装车间', type: '车间', parentId: 3, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 8, name: '冲压车间-A线', type: '产线', parentId: 4, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 9, name: '冲压车间-B线', type: '产线', parentId: 4, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 10, name: '焊接车间-A线', type: '产线', parentId: 5, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 11, name: '焊接车间-B线', type: '产线', parentId: 5, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 12, name: '装配车间-A线', type: '产线', parentId: 6, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 13, name: '装配车间-B线', type: '产线', parentId: 6, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 14, name: '涂装车间-A线', type: '产线', parentId: 7, sort: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 15, name: '涂装车间-B线', type: '产线', parentId: 7, sort: 2, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

/* ========== 角色 ========== */
export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  createdAt: string;
}

export const seedRoles: Role[] = [
  { id: 1, name: '系统管理员', code: 'admin', description: '系统管理员，拥有所有权限', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, name: '设备工程师', code: 'engineer', description: '设备维护工程师', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 3, name: '操作员', code: 'operator', description: '产线操作员', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 4, name: '巡检员', code: 'inspector', description: '巡检人员', createdAt: '2024-01-01T00:00:00.000Z' },
];

/* ========== 用户 ========== */
export interface User {
  id: number;
  username: string;
  name: string;
  password: string;
  email: string;
  phone: string;
  organizationId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const seedUsers: User[] = [
  {
    id: 1, username: 'admin', name: '系统管理员', password: '123456',
    email: 'admin@ems.com', phone: '13800000001', organizationId: 1,
    status: '启用', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2, username: 'engineer', name: '张工程师', password: '123456',
    email: 'engineer@ems.com', phone: '13800000002', organizationId: 4,
    status: '启用', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

/* ========== 设备 ========== */
export interface EquipmentParams {
  [key: string]: string | number;
}

export interface Equipment {
  id: number;
  code: string;
  name: string;
  model: string;
  manufacturer: string;
  factory: string;
  workshop: string;
  productionLine: string;
  location: string;
  type: string;
  status: string;
  params: EquipmentParams;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export const seedEquipments: Equipment[] = [
  {
    id: 1, code: 'EQ-SH-CY-001', name: '数控冲压机A', model: 'CNC-800T',
    manufacturer: '济南二机床', factory: '上海工厂', workshop: '冲压车间',
    productionLine: 'A线', location: 'A线-01号位', type: '冲压设备', status: '运行中',
    params: { ratedForce: '800T', tableSize: '2500x1250mm', strokeCount: '15-30spm' },
    parentId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2, code: 'EQ-SH-CY-002', name: '液压冲压机B', model: 'HYD-600T',
    manufacturer: '徐州锻压', factory: '上海工厂', workshop: '冲压车间',
    productionLine: 'B线', location: 'B线-01号位', type: '冲压设备', status: '运行中',
    params: { ratedForce: '600T', tableSize: '2000x1000mm', strokeCount: '10-25spm' },
    parentId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3, code: 'EQ-SH-HJ-001', name: '焊接机器人A', model: 'FANUC-R2000',
    manufacturer: '发那科', factory: '上海工厂', workshop: '焊接车间',
    productionLine: 'A线', location: 'A线-01号位', type: '焊接设备', status: '运行中',
    params: { armLength: '2000mm', payload: '200kg', axes: 6 },
    parentId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 4, code: 'EQ-SZ-ZP-001', name: '自动装配线', model: 'ASM-LINE-01',
    manufacturer: '西门子', factory: '苏州工厂', workshop: '装配车间',
    productionLine: 'A线', location: 'A线-01号位', type: '装配设备', status: '运行中',
    params: { stations: 12, cycleTime: '45s/件', capacity: '80件/h' },
    parentId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 5, code: 'EQ-SZ-TZ-001', name: '静电喷涂设备', model: 'ES-500',
    manufacturer: 'ABB', factory: '苏州工厂', workshop: '涂装车间',
    productionLine: 'A线', location: 'A线-01号位', type: '涂装设备', status: '维修中',
    params: { sprayType: '静电', nozzleCount: 8, pressure: '0.3-0.5MPa' },
    parentId: null, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

/* ========== 工单 ========== */
export interface WorkOrder {
  id: number;
  orderNo: string;
  title: string;
  equipmentId: number;
  faultType: string;
  faultLevel: 'P1' | 'P2' | 'P3';
  status: '待派单' | '已派单' | '处理中' | '待验收' | '已关闭';
  description: string;
  assignedTo: number | null;
  createdBy: number;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const seedWorkOrders: WorkOrder[] = [
  {
    id: 1, orderNo: 'WO-2024-0001', title: '数控冲压机A主轴异响', equipmentId: 1,
    faultType: '机械故障', faultLevel: 'P2', status: '处理中',
    description: '运行过程中主轴出现间歇性异响，需停机检查轴承磨损情况',
    assignedTo: 2, createdBy: 1, resolvedAt: null, closedAt: null,
    createdAt: '2024-01-15T08:00:00.000Z', updatedAt: '2024-01-15T08:00:00.000Z',
  },
  {
    id: 2, orderNo: 'WO-2024-0002', title: '焊接机器人A焊枪磨损', equipmentId: 3,
    faultType: '部件磨损', faultLevel: 'P3', status: '待派单',
    description: '焊枪导电嘴磨损严重，需更换',
    assignedTo: null, createdBy: 1, resolvedAt: null, closedAt: null,
    createdAt: '2024-01-16T10:00:00.000Z', updatedAt: '2024-01-16T10:00:00.000Z',
  },
  {
    id: 3, orderNo: 'WO-2024-0003', title: '静电喷涂设备喷嘴堵塞', equipmentId: 5,
    faultType: '管路堵塞', faultLevel: 'P1', status: '已派单',
    description: '多个喷嘴堵塞导致喷涂不均匀，影响产品质量',
    assignedTo: 2, createdBy: 1, resolvedAt: null, closedAt: null,
    createdAt: '2024-01-17T09:00:00.000Z', updatedAt: '2024-01-17T09:00:00.000Z',
  },
];

/* ========== 备件 ========== */
export interface SparePart {
  id: number;
  code: string;
  name: string;
  spec: string;
  applicableModel: string;
  quantity: number;
  safetyStock: number;
  unitPrice: number;
  supplier: string;
  createdAt: string;
  updatedAt: string;
}

export const seedSpareParts: SparePart[] = [
  {
    id: 1, code: 'SP-001', name: '主轴轴承', spec: 'SKF 7218B',
    applicableModel: 'CNC-800T', quantity: 5, safetyStock: 2,
    unitPrice: 2800.00, supplier: '斯凯孚轴承',
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2, code: 'SP-002', name: '焊枪导电嘴', spec: 'CK-200-15',
    applicableModel: 'FANUC-R2000', quantity: 20, safetyStock: 10,
    unitPrice: 45.00, supplier: '林肯电气',
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3, code: 'SP-003', name: '喷嘴组件', spec: 'ES-NOZZLE-08',
    applicableModel: 'ES-500', quantity: 8, safetyStock: 4,
    unitPrice: 320.00, supplier: 'ABB喷涂配件',
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

/* ========== 巡检计划 ========== */
export interface CheckItem {
  item: string;
  standard: string;
}

export interface InspectionPlan {
  id: number;
  name: string;
  route: string;
  cycleType: string;
  checkItems: CheckItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const seedInspectionPlans: InspectionPlan[] = [
  {
    id: 1, name: '冲压车间日常巡检', route: '冲压车间A线->B线',
    cycleType: 'daily',
    checkItems: [
      { item: '设备运行声音', standard: '无异常噪音' },
      { item: '液压油位', standard: '油位在正常范围内' },
      { item: '安全防护装置', standard: '完好有效' },
      { item: '设备清洁度', standard: '表面无油污杂物' },
    ],
    status: '启用',
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2, name: '焊接车间周检', route: '焊接车间A线->B线',
    cycleType: 'weekly',
    checkItems: [
      { item: '焊枪状态', standard: '导电嘴无磨损、保护气正常' },
      { item: '冷却水系统', standard: '流量正常、无泄漏' },
      { item: '机器人精度', standard: '重复定位精度合格' },
      { item: '接地保护', standard: '接地电阻<4Ω' },
    ],
    status: '启用',
    createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

/* ========== 巡检记录 ========== */
export interface InspectionResult {
  item: string;
  result: string;
  pass: boolean;
}

export interface InspectionRecord {
  id: number;
  planId: number;
  equipmentId: number;
  inspector: string;
  results: InspectionResult[];
  hasAbnormal: boolean;
  abnormalDesc: string | null;
  createdAt: string;
}

export const seedInspectionRecords: InspectionRecord[] = [
  {
    id: 1, planId: 1, equipmentId: 1, inspector: '张工程师',
    results: [
      { item: '设备运行声音', result: '正常', pass: true },
      { item: '液压油位', result: '正常', pass: true },
      { item: '安全防护装置', result: '正常', pass: true },
      { item: '设备清洁度', result: '轻微油污', pass: false },
    ],
    hasAbnormal: true, abnormalDesc: '设备表面有轻微油污，建议清理',
    createdAt: '2024-01-15T09:00:00.000Z',
  },
  {
    id: 2, planId: 2, equipmentId: 3, inspector: '张工程师',
    results: [
      { item: '焊枪状态', result: '正常', pass: true },
      { item: '冷却水系统', result: '正常', pass: true },
      { item: '机器人精度', result: '合格', pass: true },
      { item: '接地保护', result: '合格', pass: true },
    ],
    hasAbnormal: false, abnormalDesc: null,
    createdAt: '2024-01-16T10:00:00.000Z',
  },
];
