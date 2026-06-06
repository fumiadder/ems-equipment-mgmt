import request from './api';

/* 备件相关接口 */

/* 获取备件列表 */
export function getSparePartList(params?: Record<string, unknown>) {
  return request.get('/spare-parts', { params });
}

/* 获取备件详情 */
export function getSparePartDetail(id: string) {
  return request.get(`/spare-parts/${id}`);
}

/* 新增备件 */
export function createSparePart(data: Record<string, unknown>) {
  return request.post('/spare-parts', data);
}

/* 更新备件 */
export function updateSparePart(id: string, data: Record<string, unknown>) {
  return request.put(`/spare-parts/${id}`, data);
}

/* 备件入库 */
export function sparePartInbound(id: string, data: Record<string, unknown>) {
  return request.post(`/spare-parts/${id}/inbound`, data);
}

/* 备件出库 */
export function sparePartOutbound(id: string, data: Record<string, unknown>) {
  return request.post(`/spare-parts/${id}/outbound`, data);
}
