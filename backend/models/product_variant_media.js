const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductVariantMedia extends Model {
    static associate(models) {
      ProductVariantMedia.belongsTo(models.productVariantModel, {
        foreignKey: "productVariantId",
        as: "product_variant_media",
      });
    }
  }

  ProductVariantMedia.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      productVariantId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "ProductVariantMedia",
      tableName: "product_variant_media",
    },
  );

  return ProductVariantMedia;
};
