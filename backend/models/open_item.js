const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OpenItem extends Model {
    static associate(models) {
      OpenItem.hasMany(models.openItemMediaModel, {
        foreignKey: "openItemId",
        as: "mediaArr",
      });
      OpenItem.hasMany(models.orderItemModel, {
        foreignKey: "openItemId",
        as: "orderItems",
      });
      OpenItem.belongsTo(models.departmentModel, {
        foreignKey: "departmentId",
        as: "department",
        onDelete: "SET NULL",
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
      alias: {
        type: DataTypes.JSON,
      },
      description: {
        type: DataTypes.TEXT,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
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
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
