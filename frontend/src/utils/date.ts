/** 日期统一按本地时区输出/解析，格式固定 YYYY-MM-DD。 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

/** 距今 months 个月前的日期字符串。 */
export function monthsAgoString(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return toDateString(date);
}

/** 根据出生日期给出“X 个月 X 天”的月龄描述。 */
export function describeAge(birthday: string, now: Date = new Date()): string {
  const birth = new Date(`${birthday}T00:00:00`);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  const monthAnchor = new Date(birth);
  monthAnchor.setMonth(birth.getMonth() + months);
  if (monthAnchor.getTime() > now.getTime()) {
    months -= 1;
    monthAnchor.setMonth(birth.getMonth() + months);
  }
  const days = Math.max(0, Math.round((now.getTime() - monthAnchor.getTime()) / 86_400_000));
  if (months <= 0) return `${days} 天`;
  return days > 0 ? `${months} 个月 ${days} 天` : `${months} 个月`;
}
