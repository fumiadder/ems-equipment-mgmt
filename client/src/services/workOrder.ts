import request from './api';

/* 工单相关接口 */

/* 获取工单列表 */
export function getWorkOrderList(params?: Record<string, unknown>) {
  return request.get('/work-orders', { params });
}

/* 获取工单详情 */
export function getWorkOrderDetail(id: string) {
  return request.get(`/work-orders/${id}`);
}

/* 创建工单 */
export function createWorkOrder(data: Record<string, unknown>) {
  return request.post('/work-orders', data);
}

/* 更新工单 */
export function updateWorkOrder(id: string, data: Record<string, unknown>) {
  return request.put(`/work-orders/${id}`, data);
}

/* 工单状态变更 */
export function changeWorkOrderStatus(id: string, status: string) {
  return request.patch(`/work-orders/${id}/status`, { status });
}
