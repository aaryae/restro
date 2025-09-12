const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PurchaseItem extends Model {
    static associate(models) {
      PurchaseItem.belongsTo(models.purchaseModel, {
        foreignKey: "purchaseId",
        as: "purchase",
      });
      PurchaseItem.belongsTo(models.purchaseCategoryModel, {
        foreignKey: "categoryId",
        as: "category",
      });
    }
  }

  PurchaseItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      purchaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "purchases", key: "id" },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional for flexibility
        references: { model: "purchase_categories", key: "id" },
      },
      hsCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      particulars: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0.0 },
      },
      rate: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.0 },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      isTaxable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "PurchaseItem",
      tableName: "purchase_items",
      timestamps: true,
    },
  );

  return PurchaseItem;
};
