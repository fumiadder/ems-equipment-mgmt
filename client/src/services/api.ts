import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from '../utils/auth';

/* ---------- Mock layer ---------- */
import * as mockApi from '../mock';

/* Determine if a real backend is available.
 * When VITE_API_BASE_URL is set (at build-time or via .env) the app
 * will use real HTTP calls.  Otherwise it falls back to the in-memory
 * mock layer so the SPA can run as a pure static site on Netlify. */
const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;

/* ---------- Axios instance (used only when backend is available) ---------- */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* 请求拦截器 - 自动附加 token */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/* 响应拦截器 - 统一错误处理 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    if (response) {
      switch (response.status) {
        case 401:
          message.error('登录已过期，请重新登录');
          removeToken();
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限执行此操作');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(response.data?.message || '请求失败');
      }
    } else {
      message.error('网络异常，请检查网络连接');
    }
    return Promise.reject(error);
  },
);

/* ---------- Public "request" object ----------
 * This is the object that every service file imports.
 * When USE_MOCK is true its methods delegate to the mock layer;
 * otherwise they go through axios as before.
 *
 * The shape mirrors the AxiosInstance interface that service files
 * rely on:  request.get(url, config) / request.post(url, data) etc.
 */

type Method =
  | 'get'
  | 'delete'
  | 'head'
  | 'options'
  | 'post'
  | 'put'
  | 'patch';

interface MockRequestConfig {
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Route the URL + method to the correct mock function */
function mockDispatch(
  method: Method,
  url: string,
  config?: MockRequestConfig,
  data?: Record<string, unknown>,
): Promise<unknown> {
  const params = config?.params ?? {};
  const body = data ?? {};

  // Strip leading slash for easier matching
  const path = url.replace(/^\//, '');

  /* Equipment */
  if (path === 'equipment' && method === 'get')
    return mockApi.getEquipmentList(params);
  if (path.startsWith('equipment/') && method === 'get') {
    const id = path.split('/')[1];
    return mockApi.getEquipmentDetail(id);
  }
  if (path === 'equipment' && method === 'post')
    return mockApi.createEquipment(body);
  if (path.startsWith('equipment/') && method === 'put') {
    const id = path.split('/')[1];
    return mockApi.updateEquipment(id, body);
  }
  if (path.startsWith('equipment/') && method === 'delete') {
    const id = path.split('/')[1];
    return mockApi.deleteEquipment(id);
  }

  /* Work Orders */
  if (path === 'work-orders' && method === 'get')
    return mockApi.getWorkOrderList(params);
  if (path.startsWith('work-orders/') && method === 'get') {
    const segments = path.split('/');
    if (segments.length === 2) return mockApi.getWorkOrderDetail(segments[1]);
  }
  if (path === 'work-orders' && method === 'post')
    return mockApi.createWorkOrder(body);
  if (path.startsWith('work-orders/') && method === 'put') {
    const id = path.split('/')[1];
    return mockApi.updateWorkOrder(id, body);
  }
  if (path.match(/^work-orders\/\d+\/status$/) && method === 'patch') {
    const id = path.split('/')[1];
    return mockApi.changeWorkOrderStatus(id, body.status as string);
  }

  /* Users */
  if (path === 'users' && method === 'get')
    return mockApi.getUserList(params);
  if (path.startsWith('users/') && method === 'get') {
    const id = path.split('/')[1];
    return mockApi.getUserDetail(id);
  }
  if (path === 'users' && method === 'post')
    return mockApi.createUser(body);
  if (path.startsWith('users/') && method === 'put') {
    const id = path.split('/')[1];
    return mockApi.updateUser(id, body);
  }
  if (path.match(/^users\/\d+\/reset-password$/) && method === 'post') {
    const id = path.split('/')[1];
    return mockApi.resetUserPassword(id);
  }
  if (path.match(/^users\/\d+\/status$/) && method === 'patch') {
    const id = path.split('/')[1];
    return mockApi.toggleUserStatus(id, body.status as string);
  }

  /* Organizations */
  if (path === 'organizations/tree' && method === 'get')
    return mockApi.getOrganizationTree();
  if (path === 'organizations' && method === 'get')
    return mockApi.getOrganizationList(params);
  if (path === 'organizations' && method === 'post')
    return mockApi.createOrganization(body);
  if (path.startsWith('organizations/') && method === 'put') {
    const id = path.split('/')[1];
    return mockApi.updateOrganization(id, body);
  }
  if (path.startsWith('organizations/') && method === 'delete') {
    const id = path.split('/')[1];
    return mockApi.deleteOrganization(id);
  }

  /* Spare Parts */
  if (path === 'spare-parts' && method === 'get')
    return mockApi.getSparePartList(params);
  if (path.startsWith('spare-parts/') && method === 'get') {
    const segments = path.split('/');
    // /spare-parts/:id/inbound or /spare-parts/:id/outbound are POST
    if (segments.length === 2) return mockApi.getSparePartDetail(segments[1]);
  }
  if (path === 'spare-parts' && method === 'post')
    return mockApi.createSparePart(body);
  if (path.startsWith('spare-parts/') && method === 'put') {
    const id = path.split('/')[1];
    return mockApi.updateSparePart(id, body);
  }
  if (path.match(/^spare-parts\/\d+\/inbound$/) && method === 'post') {
    const id = path.split('/')[1];
    return mockApi.sparePartInbound(id, body);
  }
  if (path.match(/^spare-parts\/\d+\/outbound$/) && method === 'post') {
    const id = path.split('/')[1];
    return mockApi.sparePartOutbound(id, body);
  }

  /* Inspection Plans */
  if (path === 'inspection/plans' && method === 'get')
    return mockApi.getInspectionList(params);
  if (path.startsWith('inspection/plans/') && method === 'get') {
    const id = path.split('/')[2];
    return mockApi.getInspectionDetail(id);
  }
  if (path === 'inspection/plans' && method === 'post')
    return mockApi.createInspection(body);
  if (path.startsWith('inspection/plans/') && method === 'put') {
    const id = path.split('/')[2];
    return mockApi.updateInspection(id, body);
  }

  /* Inspection Records */
  if (path === 'inspection/records' && method === 'post')
    return mockApi.submitInspectionRecord(body);

  /* Dashboard */
  if (path === 'dashboard/stats' && method === 'get')
    return mockApi.getDashboardStats();
  if (path === 'dashboard/equipment-status' && method === 'get')
    return mockApi.getEquipmentStatusDistribution();
  if (path === 'dashboard/recent-work-orders' && method === 'get')
    return mockApi.getRecentWorkOrders(params);
  if (path === 'dashboard/recent-equipments' && method === 'get')
    return mockApi.getRecentEquipments(params);

  /* Fallback -- no mock handler matched */
  console.warn(`[mock] Unhandled ${method} ${path}`);
  return Promise.resolve({ code: 0, data: null, message: 'mock: no handler' });
}

/* ---------- Build the exported request object ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const request: any = USE_MOCK
  ? {
      get(url: string, config?: MockRequestConfig) {
        return mockDispatch('get', url, config);
      },
      post(url: string, data?: Record<string, unknown>) {
        return mockDispatch('post', url, {}, data);
      },
      put(url: string, data?: Record<string, unknown>) {
        return mockDispatch('put', url, {}, data);
      },
      patch(url: string, data?: Record<string, unknown>) {
        return mockDispatch('patch', url, {}, data);
      },
      delete(url: string) {
        return mockDispatch('delete', url);
      },
      interceptors: {
        request: { use: () => {} },
        response: { use: () => {} },
      },
      defaults: { headers: { common: {} } },
    }
  : axiosInstance;

export default request;
