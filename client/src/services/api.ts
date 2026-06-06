import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from '../utils/auth';

/* 创建 axios 实例 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const request = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* 请求拦截器 - 自动附加 token */
request.interceptors.request.use(
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
request.interceptors.response.use(
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

export default request;
