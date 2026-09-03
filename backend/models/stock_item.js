const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StockItem extends Model {
    static associate(models) {
      StockItem.belongsTo(models.measuringUnitModel, {
        foreignKey: "measuringUnitId",
        as: "measuringUnit",
      });
      StockItem.belongsTo(models.stockGroupModel, {
        foreignKey: "stockGroupId",
        as: "stockGroup",
      });
      StockItem.belongsTo(models.supplierModel, {
        foreignKey: "supplierId",
        as: "supplier",
      });
      StockItem.hasMany(models.stockHistoryModel, {
        foreignKey: "stockItemId",
        as: "histories",
      });
    }
  }

  StockItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      measuringUnitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "measuring_units", key: "id" },
      },
      stockGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "stock_groups", key: "id" },
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "suppliers", key: "id" },
      },
      defaultPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      openingQuantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      lowStockThreshold: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "StockItem",
      tableName: "stock_items",
      timestamps: true,
    },
  );

  return StockItem;
};
