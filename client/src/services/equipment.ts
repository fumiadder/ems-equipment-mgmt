import request from './api';

/* 设备相关接口 */

/* 获取设备列表 */
export function getEquipmentList(params?: Record<string, unknown>) {
  return request.get('/equipment', { params });
}

/* 获取设备详情 */
export function getEquipmentDetail(id: string) {
  return request.get(`/equipment/${id}`);
}

/* 新增设备 */
export function createEquipment(data: Record<string, unknown>) {
  return request.post('/equipment', data);
}

/* 更新设备 */
export function updateEquipment(id: string, data: Record<string, unknown>) {
  return request.put(`/equipment/${id}`, data);
}

/* 删除设备 */
export function deleteEquipment(id: string) {
  return request.delete(`/equipment/${id}`);
}
