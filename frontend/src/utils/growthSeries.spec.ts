import { describe, expect, it } from 'vitest';
import { buildGrowthSeries } from './growthSeries';
import type { GrowthRecord } from '../types';

function record(
  id: string,
  recordedAt: string,
  heightCm: number | null = null,
  weightKg: number | null = null,
): GrowthRecord {
  return {
    id,
    babyId: '2099799435994071041',
    recordedAt,
    heightCm,
    weightKg,
  };
}

describe('buildGrowthSeries 生长曲线聚合', () => {
  it('规则：按日期升序排列，并与身高/体重序列逐点对齐', () => {
    const series = buildGrowthSeries([
      record('3', '2026-09-01', 66, 9),
      record('1', '2026-07-01', 62, 7.6),
      record('2', '2026-08-01', 64, 8.2),
    ]);

    expect(series.dates).toEqual(['2026-07-01', '2026-08-01', '2026-09-01']);
    expect(series.height).toEqual([62, 64, 66]);
    expect(series.weight).toEqual([7.6, 8.2, 9]);
  });

  it('规则：同一日期再次记录时，最新录入（id 最大）的值进入曲线', () => {
    const series = buildGrowthSeries([
      record('100', '2026-08-01', 68.0, 8.2),
      record('200', '2026-08-01', 68.5, 8.4),
    ]);

    expect(series.dates).toEqual(['2026-08-01']);
    expect(series.height).toEqual([68.5]);
    expect(series.weight).toEqual([8.4]);
  });

  it('规则：同日取值不依赖入参顺序，乱序输入结果仍然稳定', () => {
    const newestFirst = buildGrowthSeries([
      record('200', '2026-08-01', 68.5, 8.4),
      record('100', '2026-08-01', 68.0, 8.2),
    ]);
    const oldestFirst = buildGrowthSeries([
      record('100', '2026-08-01', 68.0, 8.2),
      record('200', '2026-08-01', 68.5, 8.4),
    ]);

    expect(newestFirst).toEqual(oldestFirst);
    expect(newestFirst.height).toEqual([68.5]);
  });

  it('规则：同日只补录身高时，曲线身高取新值，体重沿用当日旧值而不是被清空', () => {
    const series = buildGrowthSeries([
      record('100', '2026-08-01', 68.0, 8.2),
      record('200', '2026-08-01', 68.5, null),
    ]);

    expect(series.height).toEqual([68.5]);
    expect(series.weight).toEqual([8.2]);
  });

  it('规则：某日期只记录体重时，身高位为 null（曲线断开），绝不用相邻日期补点', () => {
    const series = buildGrowthSeries([
      record('1', '2026-07-01', 62, 7.6),
      record('2', '2026-08-01', null, 8.2),
      record('3', '2026-09-01', 66, 9),
    ]);

    expect(series.height).toEqual([62, null, 66]);
    expect(series.weight).toEqual([7.6, 8.2, 9]);
    // 中间缺失必须真实保留为 null，而不是前后均值或相邻值
    expect(series.height[1]).toBeNull();
  });

  it('规则：一直没有身高数据时身高序列整体为 null，体重曲线不受影响', () => {
    const series = buildGrowthSeries([
      record('1', '2026-07-01', null, 7.6),
      record('2', '2026-08-01', null, 8.2),
    ]);

    expect(series.height).toEqual([null, null]);
    expect(series.weight).toEqual([7.6, 8.2]);
  });

  it('规则：长雪花 id 按数值语义比较，不能按字符串把 9… 排在 10… 之前', () => {
    const series = buildGrowthSeries([
      record('999999999999999999', '2026-08-01', 68.0, 8.2),
      record('1000000000000000000', '2026-08-01', 69.0, 8.4),
    ]);

    expect(series.height).toEqual([69.0]);
    expect(series.weight).toEqual([8.4]);
  });

  it('规则：没有任何记录时输出空序列（页面空态据此判断）', () => {
    const series = buildGrowthSeries([]);
    expect(series.dates).toEqual([]);
    expect(series.height).toEqual([]);
    expect(series.weight).toEqual([]);
  });
});
