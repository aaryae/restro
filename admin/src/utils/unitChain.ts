export type UnitRow = {
  measuringUnitId: string;
  ofUnitId: string;
  factor: string | number;
};

export type ResolvedLevel = {
  measuringUnitId: string;
  ofUnitId: string;
  factor: number;
  factorToBase: number;
};

const formatCount = (value: number) => {
  const n = Math.round((value + Number.EPSILON) * 100) / 100;
  if (n === 0) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

export function resolveUnitRows(
  baseUnitId: string,
  rows: UnitRow[] = [],
): { error: string | null; levels: ResolvedLevel[] } {
  if (!rows.length) return { error: null, levels: [] };
  if (!baseUnitId) {
    return { error: "Choose the base measuring unit first", levels: [] };
  }

  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.measuringUnitId || !row.ofUnitId) {
      return { error: "Each unit relation needs both units", levels: [] };
    }
    if (row.measuringUnitId === row.ofUnitId) {
      return { error: "A unit cannot contain itself", levels: [] };
    }
    if (row.measuringUnitId === baseUnitId) {
      return {
        error: "The base unit is the smallest count. Relate larger units to it",
        levels: [],
      };
    }
    const factor = Number(row.factor);
    if (!(factor > 0)) {
      return { error: "How many it contains must be greater than 0", levels: [] };
    }
    if (seen.has(row.measuringUnitId)) {
      return { error: "Each measuring unit can appear once", levels: [] };
    }
    seen.add(row.measuringUnitId);
  }

  const pending = rows.map((row) => ({
    measuringUnitId: row.measuringUnitId,
    ofUnitId: row.ofUnitId,
    factor: Number(row.factor),
  }));
  const factorToBase = new Map<string, number>([[baseUnitId, 1]]);
  const levels: ResolvedLevel[] = [];

  while (pending.length) {
    const index = pending.findIndex(
      (row) =>
        factorToBase.has(row.ofUnitId) &&
        !factorToBase.has(row.measuringUnitId),
    );
    if (index < 0) {
      return {
        error:
          "Each larger unit has to connect back to the base unit. Example: 1 packet = 20 piece, then 1 dozen = 12 packet",
        levels: [],
      };
    }
    const row = pending.splice(index, 1)[0];
    const toBase = (factorToBase.get(row.ofUnitId) || 1) * row.factor;
    factorToBase.set(row.measuringUnitId, toBase);
    levels.push({ ...row, factorToBase: toBase });
  }

  return { error: null, levels };
}

export function equivalenceLabel(
  baseUnitId: string,
  baseLabel: string,
  rows: UnitRow[],
  labelOf: (id: string) => string,
) {
  const { error, levels } = resolveUnitRows(baseUnitId, rows);
  if (error || !levels.length) return "";
  const sorted = [...levels].sort((a, b) => b.factorToBase - a.factorToBase);
  const parts = [`1 ${labelOf(sorted[0].measuringUnitId) || "unit"}`];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    parts.push(
      `${formatCount(current.factorToBase / next.factorToBase)} ${labelOf(next.measuringUnitId)}`.trim(),
    );
  }
  parts.push(`${formatCount(sorted[0].factorToBase)} ${baseLabel}`.trim());
  return parts.join(" = ");
}
