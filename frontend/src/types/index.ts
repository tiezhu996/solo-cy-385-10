export interface Baby {
  id: number;
  name: string;
  birthday: string;
  bloodType?: string | null;
  initialHeight?: number | null;
  initialWeight?: number | null;
}

/** 生长记录：heightCm / weightKg 均可为空，表示当次只记录了其中一项。 */
export interface GrowthRecord {
  id: number;
  babyId: number;
  /** 记录日期，格式 YYYY-MM-DD */
  recordedAt: string;
  heightCm?: number | null;
  weightKg?: number | null;
  percentile?: string | null;
}

export interface GrowthRecordInput {
  babyId: number;
  recordedAt: string;
  heightCm?: number | null;
  weightKg?: number | null;
}

export interface GrowthRange {
  start?: string;
  end?: string;
}
