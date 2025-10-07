const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.productCategoryModel, {
        foreignKey: "productCategoryId",
        as: "product_category",
      });

      Product.hasMany(models.productMediaModel, {
        foreignKey: "productId",
        as: "mediaArr",
      });
      Product.belongsTo(models.departmentModel, {
        foreignKey: "departmentId",
        as: "department",
      });
      Product.hasMany(models.productVariantModel, {
        foreignKey: "productId",
        as: "variants",
      });

      // Many-to-many relationship with Addon
      Product.belongsToMany(models.addonModel, {
        through: 'products_addons',
        foreignKey: 'productId',
        otherKey: 'addonId',
        as: 'addons',
      });
    }
  }

  Product.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      productCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alias: {
        type: DataTypes.JSON,
      },
      description: {
        type: DataTypes.TEXT,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      stockStatus: {
        type: DataTypes.ENUM("in_stock", "out_of_stock", "low_stock"),
        defaultValue: "in_stock",
      },
      reservedQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      hasVariant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Product",
      tableName: "products",
    },
  );

  return Product;
};
