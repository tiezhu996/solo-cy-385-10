import type { GrowthRange } from '../types';
import { monthsAgoString, todayString } from './date';

export interface RangeSelection extends GrowthRange {
  key: string;
}

export const RANGE_PRESETS: ReadonlyArray<{ key: string; label: string }> = [
  { key: '1m', label: '近1月' },
  { key: '3m', label: '近3月' },
  { key: '6m', label: '近6月' },
  { key: 'all', label: '全部' },
];

export const DEFAULT_RANGE: RangeSelection = { key: '3m', start: monthsAgoString(3), end: todayString() };

/** 预设 key 转成接口需要的起止日期；custom/all 原样透传。 */
export function resolveRange(selection: RangeSelection): GrowthRange {
  switch (selection.key) {
    case '1m':
      return { start: monthsAgoString(1), end: todayString() };
    case '3m':
      return { start: monthsAgoString(3), end: todayString() };
    case '6m':
      return { start: monthsAgoString(6), end: todayString() };
    case 'all':
      return {};
    default:
      return { start: selection.start, end: selection.end };
  }
}
