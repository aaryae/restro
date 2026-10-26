"use strict";

const { measuringUnitModel, stockItemUnitModel } = require("../models");
const { resolveUnitChain, UnitChainError } = require("./unit-quantity");

async function saveStockUnits(stockItemId, baseUnitId, rows, transaction) {
  const baseId = Number(baseUnitId);
  const wanted = new Set();
  for (const row of rows || []) {
    const unitId = Number(row.measuringUnitId);
    const ofUnitId = Number(row.ofUnitId);
    if (unitId && unitId !== baseId) wanted.add(unitId);
    if (ofUnitId && ofUnitId !== baseId) wanted.add(ofUnitId);
  }

  const found = wanted.size
    ? await measuringUnitModel.findAll({
        where: { id: [...wanted] },
        attributes: ["id", "name", "symbol"],
        transaction,
      })
    : [];
  if (found.length !== wanted.size) {
    throw new UnitChainError("Measuring unit not found");
  }

  const levels = resolveUnitChain(
    baseId,
    rows,
    new Map(found.map((unit) => [unit.id, unit])),
  );

  await stockItemUnitModel.destroy({
    where: { stockItemId },
    transaction,
  });
  if (levels.length) {
    await stockItemUnitModel.bulkCreate(
      levels.map((level) => ({
        stockItemId,
        measuringUnitId: level.measuringUnitId,
        ofUnitId: level.ofUnitId,
        factor: level.factor,
        factorToBase: level.factorToBase,
        level: level.level,
      })),
      { transaction },
    );
  }
  return levels;
}

module.exports = { saveStockUnits };
