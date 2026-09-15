/** 统一的 fetch 封装：拼前缀、JSON 序列化、非成功响应抛错。 */
const BASE = '/api';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError('网络异常，请稍后重试');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // 非 JSON 响应（如网关错误页），交给状态码处理
  }

  if (!res.ok || (body && typeof body === 'object' && (body as { success?: boolean }).success === false)) {
    const message =
      body && typeof body === 'object' && typeof (body as { message?: string }).message === 'string'
        ? ((body as { message: string }).message)
        : `请求失败（${res.status}）`;
    throw new ApiError(message);
  }

  return body as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
};
