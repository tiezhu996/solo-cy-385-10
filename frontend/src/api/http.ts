/** 统一的 fetch 封装：拼前缀、JSON 序列化、非成功响应抛错。 */
const BASE = '/api';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 判别接口响应：
 * - HTTP 非 2xx，或 2xx 但业务体显式 success:false（历史后端曾这样返回）→ 抛错；
 * - 200 空数组/空对象属于正常数据（正常空态），绝不能当成错误。
 * 抽成纯函数便于单元测试覆盖“空态 / 服务器错误 / 参数错误”的边界。
 */
export function parseApiResponse(status: number, body: unknown): unknown {
  const isErrorBody =
    body != null && typeof body === 'object' && (body as { success?: boolean }).success === false;

  if (status < 200 || status >= 300 || isErrorBody) {
    const message =
      body != null &&
      typeof body === 'object' &&
      typeof (body as { message?: string }).message === 'string'
        ? (body as { message: string }).message
        : `请求失败（${status}）`;
    throw new ApiError(message);
  }
  return body;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('网络异常，请稍后重试');
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // 非 JSON 响应（如网关错误页），交给状态码处理
  }

  return parseApiResponse(res.status, body) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
};
