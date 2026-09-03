const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StockHistory extends Model {
    static associate(models) {
      StockHistory.belongsTo(models.stockItemModel, {
        foreignKey: "stockItemId",
        as: "stockItem",
      });
      StockHistory.belongsTo(models.userModel, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  }

  StockHistory.init(
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
      type: {
        type: DataTypes.ENUM(
          "opening",
          "purchase",
          "adjustment_in",
          "adjustment_out",
          "waste",
        ),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      rate: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      referenceType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
      },
    },
    {
      sequelize,
      modelName: "StockHistory",
      tableName: "stock_histories",
      timestamps: true,
    },
  );

  return StockHistory;
};
