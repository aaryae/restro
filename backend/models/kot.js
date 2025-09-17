const { Model, DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  class Kot extends Model {
    static associate(models) {
      Kot.belongsTo(models.orderModel, {
        foreignKey: "orderId",
        as: "order",
        onDelete: "CASCADE",
      });

      Kot.belongsTo(models.departmentModel, {
        foreignKey: "departmentId",
        as: "department",
        onDelete: "SET NULL",
      });

      Kot.hasMany(models.orderItemModel, {
        foreignKey: "kotId",
        as: "orderItems",
        onDelete: "SET NULL",
      });
    }
  }

  Kot.init(
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
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      kotNumber: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "preparing", "ready", "cancelled"),
        defaultValue: "pending",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    },
    {
      hooks: {
        afterUpdate: async (kot, options) => {
          // Skip if status hasn't changed
          if (!kot.changed("status")) return;

          // Map Kot status to OrderItem status
          const kotStatus = kot.status;
          let orderItemStatus;
          switch (kotStatus) {
            case "ready":
              orderItemStatus = "prepared"; // Map "ready" to "prepared" for OrderItem
              break;
            case "pending":
            case "preparing":
            case "cancelled":
              orderItemStatus = kotStatus; // Direct mapping for these statuses
              break;
            default:
              return; // Unknown status, skip
          }

          // Update all OrderItems associated with this KOT
          await sequelize.models.orderItemModel.update(
            { status: orderItemStatus },
            {
              where: { kotId: kot.id },
              transaction: options.transaction,
            },
          );
        },
      },
      sequelize,
      modelName: "Kot",
      tableName: "kots",
      indexes: [
        { fields: ["orderId"] },
        { fields: ["departmentId"] },
        { fields: ["kotNumber"] },
      ],
    },
  );

  return Kot;
};
