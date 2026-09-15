/** 统一的 fetch 封装：拼前缀、JSON 序列化、非 2xx 抛错。 */
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
  if (!res.ok) {
    throw new ApiError(`请求失败（${res.status}）`);
  }
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
};
