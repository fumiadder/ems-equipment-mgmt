/**
 * Mock API layer for EMS Equipment Management System
 *
 * Every exported function matches the signature and return shape of the
 * corresponding service function.  All functions return Promises that
 * resolve to `{ code: 0, data: ..., message: '...' }` -- the same
 * envelope the backend uses.
 */

import { getStore } from './store';
import type {
  Organization,
  Equipment,
  WorkOrder,
  SparePart,
  InspectionPlan,
  InspectionRecord,
  User,
} from './data';

/* ================================================================
 *  Helpers
 * ================================================================ */

type ApiResponse<T = unknown> = Promise<{ code: number; data: T; message: string }>;

function success<T>(data: T, message = '操作成功'): ApiResponse<T> {
  return Promise.resolve({ code: 0, data, message });
}

function fail(message: string, code = 1): ApiResponse<null> {
  return Promise.resolve({ code, data: null, message });
}

/** Paginate an array in the same way the Sequelize findAndCountAll does */
function paginate<T>(
  items: T[],
  params?: Record<string, unknown>,
): { list: T[]; pagination: { page: number; pageSize: number; total: number } } {
  const page = Number(params?.page) || 1;
  const pageSize = Number(params?.pageSize) || 10;
  const start = (page - 1) * pageSize;
  return {
    list: items.slice(start, start + pageSize),
    pagination: { page, pageSize, total: items.length },
  };
}

/** Simple keyword filter (matches code or name fields) */
function keywordFilter<T>(
  items: T[],
  keyword: unknown,
  fields: string[],
): T[] {
  if (!keyword || typeof keyword !== 'string') return items;
  const kw = keyword.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => String((item as Record<string, unknown>)[f] || '').toLowerCase().includes(kw)),
  );
}

/** Exact-match filter helper */
function exactFilter<T>(
  items: T[],
  key: string,
  value: unknown,
): T[] {
  if (value === undefined || value === null || value === '') return items;
  return items.filter((item) => (item as Record<string, unknown>)[key] === value);
}

/** Sort by createdAt DESC (newest first) */
function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/* ================================================================
 *  Equipment
 * ================================================================ */

export function getEquipmentList(params?: Record<string, unknown>) {
  const store = getStore();
  let items = store.findAll('equipments') as Equipment[];

  items = exactFilter(items, 'factory', params?.factory);
  items = exactFilter(items, 'workshop', params?.workshop);
  items = exactFilter(items, 'type', params?.type);
  items = exactFilter(items, 'status', params?.status);
  items = keywordFilter(items, params?.keyword, ['code', 'name']);

  items = sortByCreatedAtDesc(items);
  const result = paginate(items, params);
  return success(result);
}

export function getEquipmentDetail(id: string) {
  const store = getStore();
  const item = store.findById('equipments', Number(id));
  if (!item) return fail('设备不存在');
  return success(item);
}

export function createEquipment(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('equipments', data as Partial<Equipment>);
  return success(item, '创建成功');
}

export function updateEquipment(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const item = store.update('equipments', Number(id), data as Partial<Equipment>);
  if (!item) return fail('设备不存在');
  return success(item, '更新成功');
}

export function deleteEquipment(id: string) {
  const store = getStore();
  const ok = store.remove('equipments', Number(id));
  if (!ok) return fail('设备不存在');
  return success(null, '删除成功');
}

/* ================================================================
 *  Work Orders
 * ================================================================ */

export function getWorkOrderList(params?: Record<string, unknown>) {
  const store = getStore();
  let items = store.findAll('workOrders') as WorkOrder[];

  items = exactFilter(items, 'status', params?.status);
  items = exactFilter(items, 'faultLevel', params?.faultLevel);
  items = exactFilter(items, 'equipmentId', params?.equipmentId);

  items = sortByCreatedAtDesc(items);

  // Enrich with equipment / assignee / creator references
  const enriched = items.map((wo) => {
    const equipment = store.findById('equipments', wo.equipmentId);
    const assignee = store.findById('users', wo.assignedTo ?? 0);
    const creator = store.findById('users', wo.createdBy);
    return {
      ...wo,
      equipment: equipment
        ? { id: equipment.id, code: equipment.code, name: equipment.name }
        : null,
      assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
      creator: creator ? { id: creator.id, name: creator.name } : null,
    };
  });

  const result = paginate(enriched, params);
  return success(result);
}

export function getWorkOrderDetail(id: string) {
  const store = getStore();
  const wo = store.findById('workOrders', Number(id)) as WorkOrder | undefined;
  if (!wo) return fail('工单不存在');

  const equipment = store.findById('equipments', wo.equipmentId);
  const assignee = store.findById('users', wo.assignedTo ?? 0);
  const creator = store.findById('users', wo.createdBy);

  return success({
    ...wo,
    equipment,
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    creator: creator ? { id: creator.id, name: creator.name } : null,
  });
}

export function createWorkOrder(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('workOrders', data as Partial<WorkOrder>);
  return success(item, '创建成功');
}

export function updateWorkOrder(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const item = store.update('workOrders', Number(id), data as Partial<WorkOrder>);
  if (!item) return fail('工单不存在');
  return success(item, '更新成功');
}

export function changeWorkOrderStatus(id: string, status: string) {
  const store = getStore();
  const wo = store.findById('workOrders', Number(id)) as WorkOrder | undefined;
  if (!wo) return fail('工单不存在');

  const updates: Partial<WorkOrder> = { status: status as WorkOrder['status'] };
  if (status === '待验收' || status === '已关闭') {
    updates.resolvedAt = new Date().toISOString();
  }
  if (status === '已关闭') {
    updates.closedAt = new Date().toISOString();
  }

  const item = store.update('workOrders', Number(id), updates);
  return success(item, '状态更新成功');
}

/* ================================================================
 *  Users
 * ================================================================ */

/** Strip password from a user object before returning to the frontend */
function stripPassword(user: User | undefined): Record<string, unknown> | undefined {
  if (!user) return undefined;
  const { password: _p, ...rest } = user;
  return rest;
}

export function getUserList(params?: Record<string, unknown>) {
  const store = getStore();
  let items = store.findAll('users') as User[];

  items = exactFilter(items, 'status', params?.status);
  items = exactFilter(items, 'organizationId', params?.organizationId);

  items = sortByCreatedAtDesc(items);

  // Enrich with organization reference
  const enriched = items.map((u) => {
    const org = store.findById('organizations', u.organizationId);
    return {
      ...stripPassword(u)!,
      organization: org
        ? { id: (org as Organization).id, name: (org as Organization).name, type: (org as Organization).type }
        : null,
    };
  });

  const result = paginate(enriched, params);
  return success(result);
}

export function getUserDetail(id: string) {
  const store = getStore();
  const user = store.findById('users', Number(id)) as User | undefined;
  if (!user) return fail('用户不存在');

  const org = store.findById('organizations', user.organizationId);
  return success({
    ...stripPassword(user)!,
    organization: org
      ? { id: (org as Organization).id, name: (org as Organization).name, type: (org as Organization).type }
      : null,
  });
}

export function createUser(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('users', data as Partial<User>);
  return success(stripPassword(item as User), '创建成功');
}

export function updateUser(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const item = store.update('users', Number(id), data as Partial<User>);
  if (!item) return fail('用户不存在');
  return success(stripPassword(item as User), '更新成功');
}

export function resetUserPassword(id: string) {
  const store = getStore();
  const user = store.findById('users', Number(id));
  if (!user) return fail('用户不存在');
  store.update('users', Number(id), { password: '123456' } as Partial<User>);
  return success(null, '密码已重置为123456');
}

export function toggleUserStatus(id: string, status: string) {
  const store = getStore();
  const user = store.findById('users', Number(id)) as User | undefined;
  if (!user) return fail('用户不存在');

  const item = store.update('users', Number(id), { status } as Partial<User>);
  const label = status === '启用' || status === 'active' ? '启用' : '禁用';
  return success(stripPassword(item as User), `用户状态已切换为${label}`);
}

/* ================================================================
 *  Organizations
 * ================================================================ */

/** Build a tree from flat organization data (same algorithm as backend) */
function buildOrgTree(orgs: Organization[]): (Organization & { children: Organization[] })[] {
  const map: Record<number, Organization & { children: Organization[] }> = {};
  const tree: (Organization & { children: Organization[] })[] = [];

  orgs.forEach((org) => {
    map[org.id] = { ...org, children: [] };
  });

  orgs.forEach((org) => {
    if (org.parentId && map[org.parentId]) {
      map[org.parentId].children.push(map[org.id]);
    } else {
      tree.push(map[org.id]);
    }
  });

  return tree;
}

export function getOrganizationTree() {
  const store = getStore();
  const orgs = store.findAll('organizations') as Organization[];
  // Sort by sort ASC, id ASC (same as backend)
  orgs.sort((a, b) => a.sort - b.sort || a.id - b.id);
  const tree = buildOrgTree(orgs);
  return success(tree);
}

export function getOrganizationList(params?: Record<string, unknown>) {
  const store = getStore();
  let items = store.findAll('organizations') as Organization[];
  items = exactFilter(items, 'type', params?.type);
  items.sort((a, b) => a.sort - b.sort || a.id - b.id);
  return success(items);
}

export function createOrganization(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('organizations', data as Partial<Organization>);
  return success(item, '创建成功');
}

export function updateOrganization(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const item = store.update('organizations', Number(id), data as Partial<Organization>);
  if (!item) return fail('组织不存在');
  return success(item, '更新成功');
}

export function deleteOrganization(id: string) {
  const store = getStore();
  const num = Number(id);
  // Check for children
  const children = store.findAll('organizations', (o) => o.parentId === num);
  if (children.length > 0) {
    return fail('存在子组织，无法删除');
  }
  const ok = store.remove('organizations', num);
  if (!ok) return fail('组织不存在');
  return success(null, '删除成功');
}

/* ================================================================
 *  Spare Parts
 * ================================================================ */

export function getSparePartList(params?: Record<string, unknown>) {
  const store = getStore();
  let items = store.findAll('spareParts') as SparePart[];

  items = keywordFilter(items, params?.keyword, ['code', 'name']);

  items = sortByCreatedAtDesc(items);
  const result = paginate(items, params);
  return success(result);
}

export function getSparePartDetail(id: string) {
  const store = getStore();
  const item = store.findById('spareParts', Number(id));
  if (!item) return fail('备件不存在');
  return success(item);
}

export function createSparePart(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('spareParts', data as Partial<SparePart>);
  return success(item, '创建成功');
}

export function updateSparePart(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const item = store.update('spareParts', Number(id), data as Partial<SparePart>);
  if (!item) return fail('备件不存在');
  return success(item, '更新成功');
}

export function sparePartInbound(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const qty = Number(data?.quantity);
  if (!qty || qty <= 0) return fail('入库数量必须大于0');

  const part = store.findById('spareParts', Number(id)) as SparePart | undefined;
  if (!part) return fail('备件不存在');

  const updated = store.update('spareParts', Number(id), {
    quantity: part.quantity + qty,
  });
  return success(updated, '入库成功');
}

export function sparePartOutbound(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const qty = Number(data?.quantity);
  if (!qty || qty <= 0) return fail('出库数量必须大于0');

  const part = store.findById('spareParts', Number(id)) as SparePart | undefined;
  if (!part) return fail('备件不存在');
  if (part.quantity < qty) return fail('库存不足');

  const updated = store.update('spareParts', Number(id), {
    quantity: part.quantity - qty,
  });
  return success(updated, '出库成功');
}

/* ================================================================
 *  Inspection Plans & Records
 * ================================================================ */

export function getInspectionList(params?: Record<string, unknown>) {
  const store = getStore();
  let items = store.findAll('inspectionPlans') as InspectionPlan[];

  items = exactFilter(items, 'status', params?.status);

  items = sortByCreatedAtDesc(items);
  const result = paginate(items, params);
  return success(result);
}

export function getInspectionDetail(id: string) {
  const store = getStore();
  const plan = store.findById('inspectionPlans', Number(id)) as InspectionPlan | undefined;
  if (!plan) return fail('巡检计划不存在');

  // Include records (sorted by createdAt DESC)
  const records = store.findAll(
    'inspectionRecords',
    (r) => r.planId === plan.id,
  ) as InspectionRecord[];
  records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return success({ ...plan, records });
}

export function createInspection(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('inspectionPlans', data as Partial<InspectionPlan>);
  return success(item, '创建成功');
}

export function updateInspection(id: string, data: Record<string, unknown>) {
  const store = getStore();
  const item = store.update('inspectionPlans', Number(id), data as Partial<InspectionPlan>);
  if (!item) return fail('巡检计划不存在');
  return success(item, '更新成功');
}

export function submitInspectionRecord(data: Record<string, unknown>) {
  const store = getStore();
  const item = store.create('inspectionRecords', data as Partial<InspectionRecord>);
  return success(item, '创建成功');
}

/* ================================================================
 *  Dashboard
 * ================================================================ */

export function getDashboardStats() {
  const store = getStore();
  const equipments = store.findAll('equipments') as Equipment[];
  const workOrders = store.findAll('workOrders') as WorkOrder[];
  const records = store.findAll('inspectionRecords') as InspectionRecord[];

  const totalEquipment = equipments.length;
  const runningEquipment = equipments.filter((e) => e.status === '运行中').length;
  const pendingOrders = workOrders.filter((wo) =>
    ['待派单', '已派单', '处理中'].includes(wo.status),
  ).length;

  // "Today" inspections
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayInspections = records.filter(
    (r) => new Date(r.createdAt).getTime() >= todayStart.getTime(),
  ).length;

  // Equipment status distribution
  const statusMap: Record<string, number> = {};
  equipments.forEach((e) => {
    statusMap[e.status] = (statusMap[e.status] || 0) + 1;
  });
  const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // Work order status distribution
  const orderStatusMap: Record<string, number> = {};
  workOrders.forEach((wo) => {
    orderStatusMap[wo.status] = (orderStatusMap[wo.status] || 0) + 1;
  });
  const orderStatusDistribution = Object.entries(orderStatusMap).map(([status, count]) => ({
    status,
    count,
  }));

  return success({
    totalEquipment,
    runningEquipment,
    pendingOrders,
    todayInspections,
    statusDistribution,
    orderStatusDistribution,
  });
}

export function getEquipmentStatusDistribution() {
  const store = getStore();
  const equipments = store.findAll('equipments') as Equipment[];

  const statusMap: Record<string, number> = {};
  equipments.forEach((e) => {
    statusMap[e.status] = (statusMap[e.status] || 0) + 1;
  });

  const distribution = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
  }));

  return success(distribution);
}

export function getRecentWorkOrders(params?: Record<string, unknown>) {
  const store = getStore();
  const limit = Number(params?.limit) || 5;
  const workOrders = store.findAll('workOrders') as WorkOrder[];
  const sorted = sortByCreatedAtDesc(workOrders);
  return success(sorted.slice(0, limit));
}

export function getRecentEquipments(params?: Record<string, unknown>) {
  const store = getStore();
  const limit = Number(params?.limit) || 5;
  const equipments = store.findAll('equipments') as Equipment[];
  const sorted = sortByCreatedAtDesc(equipments);
  return success(sorted.slice(0, limit));
}
