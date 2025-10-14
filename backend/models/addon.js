const { Model, DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  class Addon extends Model {
    static associate(models) {
      // Many-to-many relationship with Product
      Addon.belongsToMany(models.productModel, {
        through: "products_addons",
        foreignKey: "addonId",
        otherKey: "productId",
        as: "products",
      });
    }
  }

  Addon.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "addon",
      tableName: "addons",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  );

  return Addon;
};
