import request from './api';

/* 巡检相关接口 */

/* 获取巡检计划列表 */
export function getInspectionList(params?: Record<string, unknown>) {
  return request.get('/inspection/plans', { params });
}

/* 获取巡检计划详情 */
export function getInspectionDetail(id: string) {
  return request.get(`/inspection/plans/${id}`);
}

/* 创建巡检计划 */
export function createInspection(data: Record<string, unknown>) {
  return request.post('/inspection/plans', data);
}

/* 更新巡检计划 */
export function updateInspection(id: string, data: Record<string, unknown>) {
  return request.put(`/inspection/plans/${id}`, data);
}

/* 提交巡检记录 */
export function submitInspectionRecord(data: Record<string, unknown>) {
  return request.post('/inspection/records', data);
}
