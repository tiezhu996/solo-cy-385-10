import { describe, expect, it } from 'vitest';
import { ApiError, parseApiResponse } from './http';

describe('parseApiResponse 接口响应判别', () => {
  it('规则：200 空数组是正常空态，必须原样返回而不是抛错', () => {
    expect(parseApiResponse(200, [])).toEqual([]);
  });

  it('规则：200 正常数据原样返回（含字符串长 id）', () => {
    const data = [{ id: '2099799435994071041', babyId: '2099799435994071041', weightKg: 9 }];
    expect(parseApiResponse(200, data)).toBe(data);
  });

  it('规则：400 参数错误必须抛错并透传后端提示，不能伪装成空态', () => {
    const body = { success: false, code: 'VALIDATION_FAILED', message: '参数格式不正确：start' };
    expect(() => parseApiResponse(400, body)).toThrowError(ApiError);
    expect(() => parseApiResponse(400, body)).toThrow('参数格式不正确：start');
  });

  it('规则：500 服务器内部错误必须抛 INTERNAL_ERROR 提示，与未建档宝宝的空数组区分', () => {
    const body = { success: false, code: 'INTERNAL_ERROR', message: '服务器内部错误' };
    expect(() => parseApiResponse(500, body)).toThrowError(/服务器内部错误/);
  });

  it('规则：即使历史后端用 HTTP 200 返回 success:false 错误体，也要识别为失败', () => {
    const body = { success: false, code: 'INTERNAL_ERROR', message: '服务器内部错误' };
    expect(() => parseApiResponse(200, body)).toThrowError(ApiError);
  });

  it('规则：非 JSON 错误响应按状态码给出失败提示', () => {
    expect(() => parseApiResponse(502, null)).toThrow('请求失败（502）');
  });
});
