const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductMedia extends Model {
    static associate(models) {
      ProductMedia.belongsTo(models.productModel, {
        foreignKey: "productId",
        as: "product_media",
      });

      ProductMedia.belongsTo(models.openItemModel, {
        foreignKey: "openItemId",
        as: "open_item",
      });
    }
  }

  ProductMedia.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      productId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      openItemId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "ProductMedia",
      tableName: "product_media",
    },
  );

  return ProductMedia;
};
