"use strict";

const { Op } = require("sequelize");
const {
  productModel,
  productRecipeModel,
  addonModel,
  addonRecipeModel,
  openItemModel,
  stockItemModel,
  stockItemUnitModel,
  stockHistoryModel,
  measuringUnitModel,
} = require("../models");
const {
  toNumber,
  roundQty,
  toBaseQuantity,
  formatBreakdown,
  movementNote,
  UnitChainError,
} = require("./unit-quantity");
const { takeSupplierQty, restoreSupplierQty } = require("./stock-suppliers");

function stockShortageMessage({
  stockName,
  productName,
  before,
  needed,
  baseUnit,
  levels,
}) {
  const stock = stockName || "Stock";
  const product = productName || "this item";
  const same = stock.trim().toLowerCase() === product.trim().toLowerCase();
  if (before <= 0) {
    return same
      ? `${stock} is finished.`
      : `${stock} is finished, so ${product} cannot be sold.`;
  }
  const onHand = formatBreakdown(before, baseUnit, levels);
  const need = formatBreakdown(needed, baseUnit, levels);
  return same
    ? `${stock} does not have enough stock. On hand ${onHand}, this order needs ${need}.`
    : `${stock} does not have enough stock for ${product}. On hand ${onHand}, this order needs ${need}.`;
}

const unitInclude = {
  model: measuringUnitModel,
  as: "measuringUnit",
  attributes: ["id", "name", "symbol"],
};

async function salePlan(orderItem, transaction) {
  const productId = Number(orderItem?.productId);
  const addonId = Number(orderItem?.addonId);
  const openItemId = Number(orderItem?.openItemId);

  if (productId) {
    const [product, recipes] = await Promise.all([
      productModel.findByPk(productId, {
        attributes: ["id", "name"],
        transaction,
      }),
      productRecipeModel.findAll({
        where: { productId },
        order: [["stockItemId", "ASC"]],
        transaction,
      }),
    ]);
    return { name: product?.name || "", recipes };
  }

  if (addonId) {
    const [addon, recipes] = await Promise.all([
      addonModel.findByPk(addonId, {
        attributes: ["id", "name"],
        transaction,
      }),
      addonRecipeModel.findAll({
        where: { addonId },
        order: [["stockItemId", "ASC"]],
        transaction,
      }),
    ]);
    return { name: addon?.name || "", recipes };
  }

  if (openItemId) {
    const openItem = await openItemModel.findByPk(openItemId, {
      attributes: ["id", "name", "stockItemId", "stockQuantity"],
      transaction,
    });
    if (!openItem?.stockItemId || !(toNumber(openItem.stockQuantity) > 0)) {
      return { name: openItem?.name || "", recipes: [] };
    }
    const stockItem = await stockItemModel.findByPk(openItem.stockItemId, {
      attributes: ["id", "measuringUnitId"],
      transaction,
    });
    if (!stockItem) return { name: openItem.name || "", recipes: [] };
    return {
      name: openItem.name || "",
      recipes: [
        {
          stockItemId: stockItem.id,
          measuringUnitId: stockItem.measuringUnitId,
          quantity: openItem.stockQuantity,
        },
      ],
    };
  }

  return { name: "", recipes: [] };
}

/**
 * Bring one order line's ingredient usage in line with its quantity.
 * Safe to call again: history for this line is the source of what was
 * already taken, so quantity edits and cancels only move the difference.
 * Quantity on the stock item stays in the base unit. The history note
 * records how that change reads in every larger unit.
 */
async function syncOrderItemStock(orderItem, transaction) {
  const orderItemId = Number(orderItem?.id);
  if (!orderItemId) return;

  const { name, recipes } = await salePlan(orderItem, transaction);
  if (!recipes.length) return;

  const soldQty =
    orderItem.status === "cancelled" ? 0 : toNumber(orderItem.quantity);
  const globalUnits = await measuringUnitModel.findAll({
    attributes: ["id", "equalsUnitId", "equalsFactor", "equalsCount"],
    transaction,
  });

  for (const recipe of recipes) {
    const stockItem = await stockItemModel.findByPk(recipe.stockItemId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!stockItem) continue;

    const [units, baseUnit] = await Promise.all([
      stockItemUnitModel.findAll({
        where: { stockItemId: stockItem.id },
        include: [unitInclude],
        transaction,
      }),
      measuringUnitModel.findByPk(stockItem.measuringUnitId, {
        attributes: ["id", "name", "symbol"],
        transaction,
      }),
    ]);

    const perSale = toBaseQuantity(
      recipe.quantity,
      recipe.measuringUnitId,
      stockItem.measuringUnitId,
      units,
      globalUnits,
    );
    const target = roundQty(perSale * soldQty);

    const history = await stockHistoryModel.findAll({
      where: {
        stockItemId: stockItem.id,
        referenceType: "order_item",
        referenceId: orderItemId,
        type: { [Op.in]: ["sale", "sale_reversal"] },
      },
      attributes: ["type", "quantity"],
      transaction,
    });

    let net = 0;
    for (const row of history) {
      const qty = toNumber(row.quantity);
      net += row.type === "sale" ? qty : -qty;
    }
    const delta = roundQty(target - net);
    if (Math.abs(delta) < 0.001) continue;

    const before = toNumber(stockItem.quantity);
    const after = roundQty(before - delta);
    if (delta > 0 && after < 0) {
      throw new UnitChainError(
        stockShortageMessage({
          stockName: stockItem.name,
          productName: name,
          before,
          needed: delta,
          baseUnit,
          levels: units,
        }),
      );
    }
    const rate = toNumber(stockItem.defaultPrice);
    const moved = Math.abs(delta);
    const supplierSplit =
      delta > 0
        ? await takeSupplierQty(stockItem.id, moved, transaction)
        : await restoreSupplierQty(stockItem.id, moved, transaction, {
            referenceType: "order_item",
            referenceId: orderItemId,
          });

    await stockItem.update({ quantity: after }, { transaction });
    await stockHistoryModel.create(
      {
        stockItemId: stockItem.id,
        type: delta > 0 ? "sale" : "sale_reversal",
        quantity: moved,
        rate,
        value: roundQty(moved * rate),
        note: movementNote({
          deltaBase: delta,
          productName: name,
          soldQty: toNumber(orderItem.quantity),
          before,
          after,
          baseUnit,
          levels: units,
        }),
        referenceType: "order_item",
        referenceId: orderItemId,
        supplierSplit,
        createdBy: null,
      },
      { transaction },
    );
  }
}

module.exports = { syncOrderItemStock };
