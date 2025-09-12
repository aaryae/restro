const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PurchaseCategory extends Model {
    static associate(models) {
      PurchaseCategory.hasMany(models.purchaseItemModel, {
        foreignKey: "categoryId",
        as: "purchaseItems",
      });
    }
  }

  PurchaseCategory.init(
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
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "PurchaseCategory",
      tableName: "purchase_categories",
      timestamps: true,
    },
  );

  return PurchaseCategory;
};
