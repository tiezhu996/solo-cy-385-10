import { describe, expect, it } from 'vitest';
import { toGrowthInput, validateGrowthInput, type GrowthDraft } from './growthValidation';

function isoDate(offsetDays = 0): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validDraft(overrides: Partial<GrowthDraft> = {}): GrowthDraft {
  return {
    babyId: '2099799435994071041',
    recordedAt: isoDate(-5),
    heightCm: 68.5,
    weightKg: 8.4,
    ...overrides,
  };
}

describe('validateGrowthInput 生长记录写入校验', () => {
  it('规则：已建档宝宝、过去日期、数值为正时通过', () => {
    expect(validateGrowthInput(validDraft())).toBeNull();
  });

  it('规则：今天的记录允许，明天的记录必须失败', () => {
    expect(validateGrowthInput(validDraft({ recordedAt: isoDate(0) }))).toBeNull();
    expect(validateGrowthInput(validDraft({ recordedAt: isoDate(1) }))).toMatch(/不能晚于今天/);
  });

  it('规则：未选择宝宝必须失败（后端对未建档宝宝同样拒绝）', () => {
    expect(validateGrowthInput(validDraft({ babyId: '' }))).toMatch(/宝宝/);
  });

  it('规则：身高体重都为空必须失败', () => {
    expect(validateGrowthInput(validDraft({ heightCm: null, weightKg: null }))).toMatch(/至少填写一项/);
  });

  it('规则：只填一项是允许的（缺项曲线场景）', () => {
    expect(validateGrowthInput(validDraft({ heightCm: null }))).toBeNull();
    expect(validateGrowthInput(validDraft({ weightKg: null }))).toBeNull();
  });

  it('规则：零或负数必须失败，并指出是哪一项', () => {
    expect(validateGrowthInput(validDraft({ heightCm: 0 }))).toMatch(/身高/);
    expect(validateGrowthInput(validDraft({ heightCm: -1 }))).toMatch(/身高/);
    expect(validateGrowthInput(validDraft({ heightCm: 68, weightKg: 0 }))).toMatch(/体重/);
    expect(validateGrowthInput(validDraft({ heightCm: 68, weightKg: -2.5 }))).toMatch(/体重/);
  });

  it('规则：非法日期字符串必须失败', () => {
    expect(validateGrowthInput(validDraft({ recordedAt: 'not-a-date' }))).not.toBeNull();
  });

  it('规则：通过校验后转换为提交结构，长 id 原样保留', () => {
    expect(toGrowthInput(validDraft())).toEqual({
      babyId: '2099799435994071041',
      recordedAt: isoDate(-5),
      heightCm: 68.5,
      weightKg: 8.4,
    });
  });
});
