const TOKEN_KEY = 'ems_token';

/* 获取 token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/* 设置 token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/* 移除 token */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
