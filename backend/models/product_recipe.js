const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductRecipe extends Model {
    static associate(models) {
      ProductRecipe.belongsTo(models.productModel, {
        foreignKey: "productId",
        as: "product",
      });
      ProductRecipe.belongsTo(models.stockItemModel, {
        foreignKey: "stockItemId",
        as: "stockItem",
      });
      ProductRecipe.belongsTo(models.measuringUnitModel, {
        foreignKey: "measuringUnitId",
        as: "measuringUnit",
      });
    }
  }

  ProductRecipe.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
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
      modelName: "ProductRecipe",
      tableName: "product_recipes",
      timestamps: true,
    },
  );

  return ProductRecipe;
};
