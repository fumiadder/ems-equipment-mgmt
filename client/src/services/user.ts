import request from './api';

/* 用户相关接口 */

/* 获取用户列表 */
export function getUserList(params?: Record<string, unknown>) {
  return request.get('/users', { params });
}

/* 获取用户详情 */
export function getUserDetail(id: string) {
  return request.get(`/users/${id}`);
}

/* 新增用户 */
export function createUser(data: Record<string, unknown>) {
  return request.post('/users', data);
}

/* 更新用户 */
export function updateUser(id: string, data: Record<string, unknown>) {
  return request.put(`/users/${id}`, data);
}

/* 重置密码 */
export function resetUserPassword(id: string) {
  return request.post(`/users/${id}/reset-password`);
}

/* 禁用/启用用户 */
export function toggleUserStatus(id: string, status: string) {
  return request.patch(`/users/${id}/status`, { status });
}
