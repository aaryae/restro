const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.productModel, {
        foreignKey: "productId",
        as: "product",
      });
      ProductVariant.hasMany(models.productVariantMediaModel, {
        foreignKey: "productVariantId",
        as: "product_variant_media",
      });
    }
  }

  ProductVariant.init(
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
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "ProductVariant",
      tableName: "product_variants",
    },
  );

  return ProductVariant;
};
