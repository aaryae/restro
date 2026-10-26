"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class AddonRecipe extends Model {
    static associate(models) {
      AddonRecipe.belongsTo(models.addonModel, {
        foreignKey: "addonId",
        as: "addon",
      });
      AddonRecipe.belongsTo(models.stockItemModel, {
        foreignKey: "stockItemId",
        as: "stockItem",
      });
      AddonRecipe.belongsTo(models.measuringUnitModel, {
        foreignKey: "measuringUnitId",
        as: "measuringUnit",
      });
    }
  }

  AddonRecipe.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      addonId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "addons", key: "id" },
      },
      stockItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "stock_items", key: "id" },
      },
      measuringUnitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
      },
      quantity: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "AddonRecipe",
      tableName: "addon_recipes",
      timestamps: true,
    },
  );

  return AddonRecipe;
};
