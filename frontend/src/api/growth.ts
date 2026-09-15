import { http } from './http';
import type { GrowthRecord, GrowthRecordInput, GrowthRange } from '../types';

export interface GrowthQuery extends GrowthRange {
  babyId: string;
}

/** 按宝宝和日期区间查询生长记录，区间留空表示不限；babyId 为字符串雪花 ID，原样传递。 */
export function listGrowthRecords(query: GrowthQuery): Promise<GrowthRecord[]> {
  const search = new URLSearchParams({ babyId: query.babyId });
  if (query.start) search.set('start', query.start);
  if (query.end) search.set('end', query.end);
  return http.get<GrowthRecord[]>(`/growth?${search.toString()}`);
}

/** 保存一条生长记录（保持原有记录保存行为）。 */
export function saveGrowthRecord(input: GrowthRecordInput): Promise<GrowthRecord> {
  return http.post<GrowthRecord>('/growth', input);
}
