import type { GrowthRecordInput } from '../types';

export type GrowthDraft = {
  babyId: string;
  recordedAt: string;
  heightCm: number | null;
  weightKg: number | null;
};

/**
 * 生长记录写入前的前端校验，返回第一条错误提示；通过则返回 null。
 * 与后端规则保持一致：必须已选宝宝、日期不晚于今天、至少填一项、已填项为正数。
 */
export function validateGrowthInput(draft: GrowthDraft): string | null {
  if (!draft.babyId) return '请先选择宝宝';
  if (!draft.recordedAt) return '请选择记录日期';

  const recordedDate = new Date(`${draft.recordedAt}T00:00:00`);
  if (Number.isNaN(recordedDate.getTime())) return '记录日期格式不正确';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (recordedDate.getTime() > today.getTime()) return '记录日期不能晚于今天';

  if (draft.heightCm == null && draft.weightKg == null) {
    return '身高和体重至少填写一项';
  }
  if (draft.heightCm != null && draft.heightCm <= 0) return '身高必须为大于 0 的数值';
  if (draft.weightKg != null && draft.weightKg <= 0) return '体重必须为大于 0 的数值';
  return null;
}

export function toGrowthInput(draft: GrowthDraft): GrowthRecordInput {
  return {
    babyId: draft.babyId,
    recordedAt: draft.recordedAt,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
  };
}
