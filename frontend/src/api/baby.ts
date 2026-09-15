import { http } from './http';
import type { Baby } from '../types';

/** 查询宝宝档案（保持原有档案查询行为）。 */
export function listBabies(): Promise<Baby[]> {
  return http.get<Baby[]>('/babies');
}
