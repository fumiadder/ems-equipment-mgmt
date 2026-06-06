import request from './api';

/* 仪表盘相关接口 */

/* 获取仪表盘统计数据 */
export function getDashboardStats() {
  return request.get('/dashboard/stats');
}

/* 获取设备状态分布 */
export function getEquipmentStatusDistribution() {
  return request.get('/dashboard/equipment-status');
}

/* 获取最近工单 */
export function getRecentWorkOrders(params?: Record<string, unknown>) {
  return request.get('/dashboard/recent-work-orders', { params });
}

/* 获取最近设备 */
export function getRecentEquipments(params?: Record<string, unknown>) {
  return request.get('/dashboard/recent-equipments', { params });
}
