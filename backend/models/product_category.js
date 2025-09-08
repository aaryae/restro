const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class ProductCategory extends Model {
    static associate(models) {
      ProductCategory.hasMany(models.productModel, {
        foreignKey: "productCategoryId",
        as: "products",
      });
    }
  }
  ProductCategory.init(
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
        allowNull: false,
        unique: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imageUrlSecondary: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      loyaltyRequired: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      sequelize,
      tableName: "product_categories",
      modelName: "productCategory",
    },
  );

  return ProductCategory;
};
