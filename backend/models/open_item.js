const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OpenItem extends Model {
    static associate(models) {
      OpenItem.hasMany(models.productMediaModel, {
        foreignKey: "openItemId",
        as: "mediaArr",
      });
      OpenItem.hasMany(models.orderModel, {
        foreignKey: "openItemId",
        as: "orders",
      });
    }
  }

  OpenItem.init(
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
      alias: {
        type: DataTypes.JSON,
      },
      description: {
        type: DataTypes.TEXT,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1 },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: { min: 0 },
      },
      stockStatus: {
        type: DataTypes.ENUM("in_stock", "out_of_stock", "low_stock"),
        defaultValue: "in_stock",
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "OpenItem",
      tableName: "open_items",
    },
  );

  return OpenItem;
};
