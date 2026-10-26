"use strict";

const {
  productRecipeModel,
  addonRecipeModel,
  stockItemModel,
  stockItemUnitModel,
  measuringUnitModel,
} = require("../models");
const { toBaseQuantity, UnitChainError } = require("./unit-quantity");

async function replaceProductRecipes(productId, recipes, transaction) {
  return replaceOwnerRecipes(
    productRecipeModel,
    "productId",
    productId,
    recipes,
    transaction,
  );
}

async function replaceAddonRecipes(addonId, recipes, transaction) {
  return replaceOwnerRecipes(
    addonRecipeModel,
    "addonId",
    addonId,
    recipes,
    transaction,
  );
}

async function replaceOwnerRecipes(model, foreignKey, ownerId, recipes, transaction) {
  if (!Array.isArray(recipes)) return;

  const cleaned = recipes.filter((row) => row && row.stockItemId);
  const stockIds = cleaned.map((row) => Number(row.stockItemId));
  if (new Set(stockIds).size !== stockIds.length) {
    throw new UnitChainError("Each inventory item can only be linked once");
  }

  const stockItems = stockIds.length
    ? await stockItemModel.findAll({
        where: { id: stockIds },
        include: [
          {
            model: measuringUnitModel,
            as: "measuringUnit",
            attributes: ["id", "name", "symbol"],
          },
          {
            model: stockItemUnitModel,
            as: "units",
          },
        ],
        transaction,
      })
    : [];
  const byId = new Map(stockItems.map((item) => [item.id, item]));

  const globalUnits = await measuringUnitModel.findAll({
    attributes: ["id", "equalsUnitId", "equalsFactor", "equalsCount"],
    transaction,
  });

  const rows = [];
  for (const recipe of cleaned) {
    const item = byId.get(Number(recipe.stockItemId));
    if (!item) {
      throw new UnitChainError("Inventory item not found");
    }
    const quantity = Number(recipe.quantity);
    if (!(quantity > 0)) {
      throw new UnitChainError("Recipe quantity must be greater than 0");
    }
    const unitId = Number(recipe.measuringUnitId || item.measuringUnitId);
    toBaseQuantity(
      quantity,
      unitId,
      item.measuringUnitId,
      item.units || [],
      globalUnits,
    );
    rows.push({
      [foreignKey]: ownerId,
      stockItemId: item.id,
      measuringUnitId: unitId,
      quantity,
    });
  }

  await model.destroy({
    where: { [foreignKey]: ownerId },
    transaction,
  });
  if (rows.length) {
    await model.bulkCreate(rows, { transaction });
  }
}

module.exports = { replaceProductRecipes, replaceAddonRecipes };
