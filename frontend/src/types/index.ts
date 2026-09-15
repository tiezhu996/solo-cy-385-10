export interface Baby {
  /** 后端雪花 ID，统一以字符串承载，避免 JS number 丢失末位精度 */
  id: string;
  name: string;
  birthday: string;
  bloodType?: string | null;
  initialHeight?: number | null;
  initialWeight?: number | null;
}

/** 生长记录：heightCm / weightKg 均可为空，表示当次只记录了其中一项。 */
export interface GrowthRecord {
  id: string;
  babyId: string;
  /** 记录日期，格式 YYYY-MM-DD */
  recordedAt: string;
  heightCm?: number | null;
  weightKg?: number | null;
  percentile?: string | null;
}

export interface GrowthRecordInput {
  babyId: string;
  recordedAt: string;
  heightCm?: number | null;
  weightKg?: number | null;
}

export interface GrowthRange {
  start?: string;
  end?: string;
}
