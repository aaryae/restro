const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StockItemUnit extends Model {
    static associate(models) {
      StockItemUnit.belongsTo(models.stockItemModel, {
        foreignKey: "stockItemId",
        as: "stockItem",
      });
      StockItemUnit.belongsTo(models.measuringUnitModel, {
        foreignKey: "measuringUnitId",
        as: "measuringUnit",
      });
      StockItemUnit.belongsTo(models.measuringUnitModel, {
        foreignKey: "ofUnitId",
        as: "ofUnit",
      });
    }
  }

  StockItemUnit.init(
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
      measuringUnitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
      },
      ofUnitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
      },
      factor: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
      },
      factorToBase: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
      },
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "StockItemUnit",
      tableName: "stock_item_units",
      timestamps: true,
    },
  );

  return StockItemUnit;
};
