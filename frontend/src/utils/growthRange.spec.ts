import { describe, expect, it } from 'vitest';
import { resolveRange } from './growthRange';

describe('resolveRange 时间段解析', () => {
  it('规则：“全部”不带任何起止日期，查询全部记录', () => {
    expect(resolveRange({ key: 'all' })).toEqual({});
  });

  it('规则：自定义范围原样透传用户选择的起止日期', () => {
    const selection = { key: 'custom', start: '2026-01-01', end: '2026-03-31' };
    expect(resolveRange(selection)).toEqual({ start: '2026-01-01', end: '2026-03-31' });
  });

  it('规则：近 1/3/6 月预设解析出合法起止区间，且起不晚于止', () => {
    for (const key of ['1m', '3m', '6m'] as const) {
      const range = resolveRange({ key });
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.start!.localeCompare(range.end!)).toBeLessThanOrEqual(0);
    }
  });

  it('规则：未知 key 不透出多余字段，返回 undefined 起止（与不限等价）', () => {
    expect(resolveRange({ key: 'unknown' })).toEqual({ start: undefined, end: undefined });
  });
});
