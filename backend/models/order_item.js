const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.orderModel, {
        foreignKey: "orderId",
        as: "order",
        onDelete: "CASCADE",
      });

      OrderItem.belongsTo(models.productModel, {
        foreignKey: "productId",
        as: "product",
        onDelete: "SET NULL",
      });

      OrderItem.belongsTo(models.departmentModel, {
        foreignKey: "departmentId",
        as: "department",
        onDelete: "SET NULL",
      });

      OrderItem.belongsTo(models.openItemModel, {
        foreignKey: "openItemId",
        as: "openItem",
        onDelete: "SET NULL",
      });

      OrderItem.belongsTo(models.kotModel, {
        foreignKey: "kotId",
        as: "kot",
        onDelete: "SET NULL",
      });
    }
  }

  OrderItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      openItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      kotId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 1 },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      specialInstructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "preparing",
          "prepared",
          "served",
          "cancelled",
        ),
        defaultValue: "pending",
      },
    },
    {
      hooks: {
        beforeValidate: (orderItem) => {
          if (
            (orderItem.productId && orderItem.openItemId) ||
            (!orderItem.productId && !orderItem.openItemId)
          ) {
            throw new Error(
              "OrderItem must reference exactly one of productId or openItemId.",
            );
          }
        },
        beforeCreate: (orderItem) => {
          orderItem.subtotal =
            orderItem.price * orderItem.quantity - (orderItem.discount || 0);
        },
        beforeUpdate: (orderItem) => {
          orderItem.subtotal =
            orderItem.price * orderItem.quantity - (orderItem.discount || 0);
        },
        afterCreate: async (orderItem, options) => {
          if (orderItem.openItemId) {
            const openItem = await sequelize.models.openItemModel.findByPk(
              orderItem.openItemId,
              { transaction: options.transaction },
            );
            if (openItem) {
              const newQuantity = openItem.quantity - orderItem.quantity;
              await openItem.update(
                {
                  quantity: newQuantity,
                  stockStatus:
                    newQuantity <= 0
                      ? "out_of_stock"
                      : newQuantity < 10
                        ? "low_stock"
                        : "in_stock",
                },
                { transaction: options.transaction }, // Fixed typo
              );
            }
          }
        },
      },
      timestamps: true,
      sequelize,
      modelName: "OrderItem",
      tableName: "order_items",
      indexes: [
        { fields: ["orderId", "productId"] },
        { fields: ["orderId", "openItemId"] },
        { fields: ["kotId"] },
      ],
    },
  );

  return OrderItem;
};
