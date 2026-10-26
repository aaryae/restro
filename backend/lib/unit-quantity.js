"use strict";

/**
 * Stock is stored in one base unit. Larger units are a chain on the stock
 * item (1 dozen = 12 packet, 1 packet = 20 piece) because the piece count
 * changes from product to product.
 */

const roundQty = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

class UnitChainError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnitChainError";
    this.status = 400;
    this.success = false;
  }

  toResponse() {
    return {
      status: this.status,
      success: false,
      message: this.message,
      data: null,
    };
  }
}

const formatCount = (value) => {
  const n = roundQty(value);
  if (Object.is(n, -0) || n === 0) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const unitSymbol = (unit) => unit?.symbol || unit?.name || "";

/**
 * rows: { measuringUnitId, ofUnitId, factor }
 * Meaning: 1 measuringUnit = factor × ofUnit.
 * The chain has to connect back to baseUnitId.
 */
function resolveUnitChain(baseUnitId, rows, unitsById) {
  const baseId = Number(baseUnitId);
  const input = (rows || []).map((row) => ({
    measuringUnitId: Number(row.measuringUnitId),
    ofUnitId: Number(row.ofUnitId),
    factor: toNumber(row.factor),
  }));

  if (input.length === 0) return [];
  if (!baseId) {
    throw new UnitChainError("Choose the base measuring unit first");
  }

  const seen = new Set();
  for (const row of input) {
    if (!row.measuringUnitId || !row.ofUnitId) {
      throw new UnitChainError("Each unit relation needs both units");
    }
    if (row.measuringUnitId === row.ofUnitId) {
      throw new UnitChainError("A unit cannot contain itself");
    }
    if (row.measuringUnitId === baseId) {
      throw new UnitChainError(
        "The base unit is the smallest count. Relate larger units to it",
      );
    }
    if (!(row.factor > 0)) {
      throw new UnitChainError("How many it contains must be greater than 0");
    }
    if (seen.has(row.measuringUnitId)) {
      throw new UnitChainError("Each measuring unit can appear once");
    }
    seen.add(row.measuringUnitId);
    if (unitsById && !unitsById.has(row.measuringUnitId)) {
      throw new UnitChainError("Measuring unit not found");
    }
    if (
      unitsById &&
      row.ofUnitId !== baseId &&
      !unitsById.has(row.ofUnitId)
    ) {
      throw new UnitChainError("Measuring unit not found");
    }
  }

  const pending = [...input];
  const factorToBase = new Map([[baseId, 1]]);
  const levels = [];

  while (pending.length) {
    const index = pending.findIndex(
      (row) =>
        factorToBase.has(row.ofUnitId) &&
        !factorToBase.has(row.measuringUnitId),
    );
    if (index < 0) {
      throw new UnitChainError(
        "Each larger unit has to connect back to the base unit. Example: 1 packet = 20 piece, then 1 dozen = 12 packet",
      );
    }
    const row = pending.splice(index, 1)[0];
    const toBase = factorToBase.get(row.ofUnitId) * row.factor;
    factorToBase.set(row.measuringUnitId, toBase);
    levels.push({
      measuringUnitId: row.measuringUnitId,
      ofUnitId: row.ofUnitId,
      factor: row.factor,
      factorToBase: toBase,
      level: levels.length + 1,
    });
  }

  return levels;
}

function conversionFactor(unitId, baseUnitId, levels, globalUnits) {
  const stock = new Map(
    (levels || []).map((row) => [
      Number(row.measuringUnitId),
      toNumber(row.factorToBase),
    ]),
  );
  const globals = new Map(
    (globalUnits || []).map((unit) => [Number(unit.id), unit]),
  );
  const seen = new Set();

  const walk = (id) => {
    const current = Number(id);
    if (current === Number(baseUnitId)) return 1;
    if (stock.has(current)) return stock.get(current);
    if (seen.has(current)) {
      throw new UnitChainError("Unit relation loops back on itself");
    }
    const unit = globals.get(current);
    const next = Number(unit?.equalsUnitId);
    const right = toNumber(unit?.equalsFactor);
    const left = toNumber(unit?.equalsCount) || 1;
    if (!next || !(right > 0) || !(left > 0)) {
      throw new UnitChainError(
        "That unit is not connected to this stock item. Set the relation on the measuring unit, or add it on the stock item",
      );
    }
    seen.add(current);
    return (right / left) * walk(next);
  };

  return walk(unitId);
}

function toBaseQuantity(quantity, unitId, baseUnitId, levels, globalUnits) {
  const qty = toNumber(quantity);
  const unit = Number(unitId);
  const base = Number(baseUnitId);
  if (!unit || unit === base) return roundQty(qty);
  const level = (levels || []).find(
    (row) => Number(row.measuringUnitId) === unit,
  );
  if (level) return roundQty(qty * toNumber(level.factorToBase));
  return roundQty(qty * conversionFactor(unit, base, levels, globalUnits));
}

function breakdownParts(quantity, baseUnit, levels) {
  const amount = toNumber(quantity);
  const sorted = [...(levels || [])].sort(
    (a, b) => toNumber(b.factorToBase) - toNumber(a.factorToBase),
  );

  if (amount < 0 || sorted.length === 0) {
    return [
      {
        count: roundQty(amount),
        symbol: unitSymbol(baseUnit),
        name: baseUnit?.name || "",
        factorToBase: 1,
      },
    ];
  }

  let remaining = amount;
  const parts = [];
  for (const level of sorted) {
    const size = toNumber(level.factorToBase);
    if (size <= 0) continue;
    const count = Math.floor((remaining + 1e-9) / size);
    remaining = roundQty(remaining - count * size);
    if (count !== 0) {
      parts.push({
        count,
        symbol: unitSymbol(level.measuringUnit || level),
        name: level.measuringUnit?.name || level.name || "",
        factorToBase: size,
      });
    }
  }

  const baseCount = roundQty(remaining);
  if (baseCount !== 0 || parts.length === 0) {
    parts.push({
      count: baseCount,
      symbol: unitSymbol(baseUnit),
      name: baseUnit?.name || "",
      factorToBase: 1,
    });
  }
  return parts;
}

function formatBreakdown(quantity, baseUnit, levels) {
  return breakdownParts(quantity, baseUnit, levels)
    .map((part) => `${formatCount(part.count)} ${part.symbol}`.trim())
    .join(" + ");
}

function formatEquivalence(levels, baseUnit) {
  const sorted = [...(levels || [])].sort(
    (a, b) => toNumber(b.factorToBase) - toNumber(a.factorToBase),
  );
  if (!sorted.length) return "";

  const parts = [`1 ${unitSymbol(sorted[0].measuringUnit || sorted[0])}`];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const times = toNumber(current.factorToBase) / toNumber(next.factorToBase);
    parts.push(
      `${formatCount(times)} ${unitSymbol(next.measuringUnit || next)}`.trim(),
    );
  }
  parts.push(
    `${formatCount(sorted[0].factorToBase)} ${unitSymbol(baseUnit)}`.trim(),
  );
  return parts.join(" = ");
}

function movementNote({
  deltaBase,
  productName,
  soldQty,
  before,
  after,
  baseUnit,
  levels,
}) {
  const symbol = unitSymbol(baseUnit);
  const verb = deltaBase > 0 ? "Sold" : "Restored";
  const sign = deltaBase > 0 ? "−" : "+";
  const amount = `${sign}${formatCount(Math.abs(deltaBase))} ${symbol}`.trim();
  const subject = productName
    ? `${verb} ${productName} × ${formatCount(soldQty)}`
    : verb;
  let note = `${subject}: ${amount}. On hand ${formatBreakdown(before, baseUnit, levels)} → ${formatBreakdown(after, baseUnit, levels)}`;
  if (levels?.length) {
    note += ` (${formatCount(before)} → ${formatCount(after)} ${symbol})`;
  }
  return note;
}

module.exports = {
  UnitChainError,
  roundQty,
  toNumber,
  resolveUnitChain,
  toBaseQuantity,
  formatBreakdown,
  formatEquivalence,
  movementNote,
};
