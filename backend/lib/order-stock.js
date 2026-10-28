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
  sequelize,
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
    });
    if (!stockItem) continue;

    const seed =
      stockItem.mergedIntoId
        ? (await stockItemModel.findByPk(stockItem.mergedIntoId, {
            transaction,
          })) || stockItem
        : stockItem;

    const family = await stockItemModel.findAll({
      where: {
        measuringUnitId: seed.measuringUnitId,
        mergedIntoId: null,
        [Op.and]: [
          sequelize.where(
            sequelize.fn(
              "lower",
              sequelize.fn("btrim", sequelize.col("name")),
            ),
            String(seed.name || "").trim().toLowerCase(),
          ),
        ],
      },
      order: [["id", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const batches = family.length ? family : [seed];
    const batchIds = batches.map((batch) => batch.id);

    const [unitRows, baseUnit] = await Promise.all([
      stockItemUnitModel.findAll({
        where: { stockItemId: { [Op.in]: batchIds } },
        include: [unitInclude],
        transaction,
      }),
      measuringUnitModel.findByPk(stockItem.measuringUnitId, {
        attributes: ["id", "name", "symbol"],
        transaction,
      }),
    ]);
    const unitsByItem = new Map();
    for (const row of unitRows) {
      const list = unitsByItem.get(row.stockItemId) || [];
      list.push(row);
      unitsByItem.set(row.stockItemId, list);
    }
    const recipeUnits = unitsByItem.get(stockItem.id) || [];

    const perSale = toBaseQuantity(
      recipe.quantity,
      recipe.measuringUnitId,
      stockItem.measuringUnitId,
      recipeUnits,
      globalUnits,
    );
    const target = roundQty(perSale * soldQty);

    const history = await stockHistoryModel.findAll({
      where: {
        stockItemId: { [Op.in]: batchIds },
        referenceType: "order_item",
        referenceId: orderItemId,
        type: { [Op.in]: ["sale", "sale_reversal"] },
      },
      attributes: ["stockItemId", "type", "quantity"],
      transaction,
    });

    const netByItem = new Map();
    let net = 0;
    for (const row of history) {
      const qty = toNumber(row.quantity);
      const signed = row.type === "sale" ? qty : -qty;
      net = roundQty(net + signed);
      netByItem.set(
        row.stockItemId,
        roundQty((netByItem.get(row.stockItemId) || 0) + signed),
      );
    }
    const delta = roundQty(target - net);
    if (Math.abs(delta) < 0.001) continue;

    const oldest = batches[0];
    const onHand = toNumber(oldest.quantity);
    if (delta > 0 && roundQty(onHand - delta) < 0) {
      throw new UnitChainError(
        stockShortageMessage({
          stockName: oldest.name,
          productName: name,
          before: onHand,
          needed: delta,
          baseUnit,
          levels: unitsByItem.get(oldest.id) || recipeUnits,
        }),
      );
    }

    const moves = [];
    if (delta > 0) {
      moves.push({ batch: oldest, signed: delta });
    } else {
      let left = Math.abs(delta);
      for (const batch of [...batches].reverse()) {
        if (left < 0.001) break;
        const taken = netByItem.get(batch.id) || 0;
        if (taken <= 0) continue;
        const put = roundQty(Math.min(taken, left));
        if (put < 0.001) continue;
        moves.push({ batch, signed: -put });
        left = roundQty(left - put);
      }
      if (left >= 0.001) {
        moves.push({ batch: batches[0], signed: -left });
      }
    }

    for (const move of moves) {
      const before = toNumber(move.batch.quantity);
      const after = roundQty(before - move.signed);
      const moved = Math.abs(move.signed);
      const supplierSplit =
        move.signed > 0
          ? await takeSupplierQty(move.batch.id, moved, transaction)
          : await restoreSupplierQty(move.batch.id, moved, transaction, {
              referenceType: "order_item",
              referenceId: orderItemId,
            });
      await move.batch.update({ quantity: after }, { transaction });
      const rate = toNumber(move.batch.defaultPrice);
      await stockHistoryModel.create(
        {
          stockItemId: move.batch.id,
          type: move.signed > 0 ? "sale" : "sale_reversal",
          quantity: moved,
          rate,
          value: roundQty(moved * rate),
          note: movementNote({
            deltaBase: move.signed,
            productName: name,
            soldQty: toNumber(orderItem.quantity),
            before,
            after,
            baseUnit,
            levels: unitsByItem.get(move.batch.id) || recipeUnits,
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
}

module.exports = { syncOrderItemStock };
