import type { GrowthRecord } from '../types';

export interface GrowthSeries {
  /** 升序去重后的日期，作为曲线横轴 */
  dates: string[];
  /** 与 dates 对齐的身高序列；该日期从未录过身高时为 null（曲线断开，不用相邻值补点） */
  height: (number | null)[];
  /** 与 dates 对齐的体重序列；该日期从未录过体重时为 null */
  weight: (number | null)[];
}

/** 雪花 ID 是字符串，按数值语义比较大小。 */
function isNewer(candidate: string | number, current: string | number): boolean {
  return String(candidate).localeCompare(String(current), undefined, { numeric: true }) > 0;
}

/**
 * 把生长记录按日期归并为曲线序列：
 * - 同一日期多次记录：标识最大（最新录入）的非空值进入曲线（新值生效），旧行仍保留在明细中可回看；
 * - 某次只录了一项：另一项在该日不产生点位（沿用该日此前的值，没有就是 null），
 *   绝不使用相邻日期的值补点；
 * - 入参顺序无关，输出日期恒为升序，保证多次运行结果稳定。
 */
export function buildGrowthSeries(records: GrowthRecord[]): GrowthSeries {
  const datesSet = new Set<string>();
  const heightByDate = new Map<string, { value: number; recordId: string | number }>();
  const weightByDate = new Map<string, { value: number; recordId: string | number }>();

  for (const record of records) {
    datesSet.add(record.recordedAt);
    if (record.heightCm != null) {
      const current = heightByDate.get(record.recordedAt);
      if (!current || isNewer(record.id, current.recordId)) {
        heightByDate.set(record.recordedAt, { value: record.heightCm, recordId: record.id });
      }
    }
    if (record.weightKg != null) {
      const current = weightByDate.get(record.recordedAt);
      if (!current || isNewer(record.id, current.recordId)) {
        weightByDate.set(record.recordedAt, { value: record.weightKg, recordId: record.id });
      }
    }
  }

  const dates = [...datesSet].sort();
  return {
    dates,
    height: dates.map((date) => heightByDate.get(date)?.value ?? null),
    weight: dates.map((date) => weightByDate.get(date)?.value ?? null),
  };
}
