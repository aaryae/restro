/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalDateString(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalYmd(): string {
  return toLocalDateString(new Date());
}

/** True when YYYY-MM-DD is after today's local calendar date. */
export function isFutureLocalDate(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return true;
  return ymd > todayLocalYmd();
}
