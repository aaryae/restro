export function toTrendData(
  rows: Array<{ date?: string; amount?: number }>,
  valueKey = "Amount",
) {
  return (rows || []).map((row) => ({
    name: String(row.date || "").slice(5),
    [valueKey]: Number(row.amount) || 0,
  }));
}
