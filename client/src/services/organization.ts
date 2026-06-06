import request from './api';

/* 组织架构相关接口 */

/* 获取组织树 */
export function getOrganizationTree() {
  return request.get('/organizations/tree');
}

/* 获取组织列表 */
export function getOrganizationList(params?: Record<string, unknown>) {
  return request.get('/organizations', { params });
}

/* 新增组织 */
export function createOrganization(data: Record<string, unknown>) {
  return request.post('/organizations', data);
}

/* 更新组织 */
export function updateOrganization(id: string, data: Record<string, unknown>) {
  return request.put(`/organizations/${id}`, data);
}

/* 删除组织 */
export function deleteOrganization(id: string) {
  return request.delete(`/organizations/${id}`);
}
