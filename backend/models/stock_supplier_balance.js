"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StockSupplierBalance extends Model {
    static associate(models) {
      StockSupplierBalance.belongsTo(models.stockItemModel, {
        foreignKey: "stockItemId",
        as: "stockItem",
      });
      StockSupplierBalance.belongsTo(models.supplierModel, {
        foreignKey: "supplierId",
        as: "supplier",
      });
    }
  }

  StockSupplierBalance.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      stockItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "stock_items", key: "id" },
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "suppliers", key: "id" },
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "StockSupplierBalance",
      tableName: "stock_supplier_balances",
      timestamps: true,
    },
  );

  return StockSupplierBalance;
};
