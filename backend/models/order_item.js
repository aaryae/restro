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

      // Add new associations for addons
      OrderItem.hasMany(models.orderItemModel, {
        foreignKey: "parentOrderItemId",
        as: "addons",
        onDelete: "CASCADE",
      });

      OrderItem.belongsTo(models.orderItemModel, {
        foreignKey: "parentOrderItemId",
        as: "parentItem",
      });

      OrderItem.belongsTo(models.addonModel, {
        foreignKey: "addonId",
        as: "addon",
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
      // New fields for addons
      parentOrderItemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "order_items",
          key: "id",
        },
      },
      addonId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "addons",
          key: "id",
        },
      },
      isAddon: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
          "ready",
          "served",
          "completed",
          "cancelled",
        ),
        defaultValue: "pending",
      },
    },
    {
      hooks: {
        beforeValidate: (orderItem, options) => {
          // Skip validation if this is a bulk update from KOT status change
          if (
            options &&
            options.fields &&
            options.fields.length === 1 &&
            options.fields[0] === "status"
          ) {
            return;
          }

          // Skip validation if this is a bulk update from order item transfer
          if (
            options &&
            options.fields &&
            options.fields.length === 1 &&
            options.fields[0] === "orderId"
          ) {
            return;
          }

          // For addons
          if (orderItem.isAddon) {
            if (!orderItem.addonId) {
              throw new Error("Addon ID is required for addon items");
            }
            if (!orderItem.parentOrderItemId) {
              throw new Error("Parent order item ID is required for addons");
            }
          } else {
            // For regular items
            if (
              (orderItem.productId && orderItem.openItemId) ||
              (!orderItem.productId && !orderItem.openItemId)
            ) {
              throw new Error(
                "OrderItem must reference exactly one of productId or openItemId",
              );
            }
          }
        },
        beforeCreate: (orderItem) => {
          orderItem.subtotal =
            orderItem.price * orderItem.quantity - (orderItem.discount || 0);
        },
        beforeUpdate: (orderItem) => {
          if (
            orderItem.changed("quantity") ||
            orderItem.changed("price") ||
            orderItem.changed("discount")
          ) {
            orderItem.subtotal =
              orderItem.price * orderItem.quantity - (orderItem.discount || 0);
          }
        },
        afterCreate: async (orderItem, options) => {
          if (orderItem.openItemId && !orderItem.isAddon) {
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
                { transaction: options.transaction },
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
        { fields: ["parentOrderItemId"] },
        { fields: ["addonId"] },
        { fields: ["isAddon"] },
      ],
    },
  );

  return OrderItem;
};
