"use strict";

const { Op } = require("sequelize");
const { stockSupplierBalanceModel, stockHistoryModel } = require("../models");
const { roundQty, toNumber } = require("./unit-quantity");

function blendedRate(oldQty, oldRate, addQty, addRate) {
  const nextQty = toNumber(oldQty) + toNumber(addQty);
  if (nextQty <= 0) return roundQty(addRate);
  return (
    Math.round(
      ((toNumber(oldQty) * toNumber(oldRate) +
        toNumber(addQty) * toNumber(addRate)) /
        nextQty) *
        100,
    ) / 100
  );
}

function findBalance(stockItemId, supplierId, transaction) {
  return stockSupplierBalanceModel.findOne({
    where: {
      stockItemId,
      supplierId: supplierId || null,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

async function addSupplierQty(stockItemId, supplierId, quantity, transaction) {
  const qty = roundQty(quantity);
  if (!(qty > 0)) return null;
  const sid = supplierId || null;
  const row = await findBalance(stockItemId, sid, transaction);
  if (row) {
    await row.update(
      { quantity: roundQty(toNumber(row.quantity) + qty) },
      { transaction },
    );
    return row;
  }
  return stockSupplierBalanceModel.create(
    { stockItemId, supplierId: sid, quantity: qty },
    { transaction },
  );
}

async function takeFromRow(row, qty, transaction) {
  const have = toNumber(row.quantity);
  if (have <= 0 || qty <= 0) return 0;
  const use = Math.min(have, qty);
  await row.update(
    { quantity: roundQty(have - use) },
    { transaction },
  );
  return roundQty(use);
}

/**
 * Remove quantity from supplier buckets. A named supplier is used first
 * when supplierId is passed (purchase reversal). Otherwise the oldest
 * bucket is used, so opening stock with no supplier is used before later buys.
 */
async function takeSupplierQty(stockItemId, quantity, transaction, supplierId) {
  const qty = roundQty(quantity);
  if (!(qty > 0)) return [];
  const rows = await stockSupplierBalanceModel.findAll({
    where: { stockItemId },
    order: [["id", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const ordered = supplierId
    ? [
        ...rows.filter((row) => Number(row.supplierId) === Number(supplierId)),
        ...rows.filter((row) => Number(row.supplierId) !== Number(supplierId)),
      ]
    : rows;

  let left = qty;
  const taken = [];
  for (const row of ordered) {
    if (left <= 0.001) break;
    const use = await takeFromRow(row, left, transaction);
    if (use > 0) {
      taken.push({ supplierId: row.supplierId || null, quantity: use });
      left = roundQty(left - use);
    }
  }
  return taken;
}

async function restoreSupplierQty(
  stockItemId,
  quantity,
  transaction,
  { referenceType, referenceId } = {},
) {
  const qty = roundQty(quantity);
  if (!(qty > 0)) return [];
  if (!referenceType || !referenceId) {
    await addSupplierQty(stockItemId, null, qty, transaction);
    return [{ supplierId: null, quantity: qty }];
  }

  const rows = await stockHistoryModel.findAll({
    where: {
      stockItemId,
      referenceType,
      referenceId,
      type: { [Op.in]: ["sale", "sale_reversal"] },
    },
    order: [["id", "ASC"]],
    transaction,
  });
  const net = new Map();
  for (const row of rows) {
    const split = Array.isArray(row.supplierSplit) ? row.supplierSplit : [];
    const sign = row.type === "sale" ? 1 : -1;
    for (const part of split) {
      const key = part.supplierId || 0;
      net.set(key, roundQty((net.get(key) || 0) + sign * toNumber(part.quantity)));
    }
  }

  let left = qty;
  const restored = [];
  for (const [key, amount] of net) {
    if (left <= 0.001 || amount <= 0) continue;
    const use = roundQty(Math.min(amount, left));
    await addSupplierQty(stockItemId, key || null, use, transaction);
    restored.push({ supplierId: key || null, quantity: use });
    left = roundQty(left - use);
  }
  if (left > 0.001) {
    await addSupplierQty(stockItemId, null, left, transaction);
    restored.push({ supplierId: null, quantity: left });
  }
  return restored;
}

async function receiveStock(stockItem, quantity, rate, supplierId, transaction) {
  const qty = roundQty(quantity);
  const oldQty = toNumber(stockItem.quantity);
  const nextQty = roundQty(oldQty + qty);
  const nextRate = blendedRate(
    oldQty,
    stockItem.defaultPrice,
    qty,
    rate,
  );
  await stockItem.update(
    { quantity: nextQty, defaultPrice: nextRate },
    { transaction },
  );
  await addSupplierQty(stockItem.id, supplierId, qty, transaction);
}

module.exports = {
  addSupplierQty,
  takeSupplierQty,
  restoreSupplierQty,
  receiveStock,
};
