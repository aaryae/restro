const { Model, DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.customerModel, {
        foreignKey: "customerId",
        as: "customer",
        onDelete: "SET NULL",
      });

      Order.hasMany(models.orderItemModel, {
        foreignKey: "orderId",
        as: "orderItems",
        onDelete: "CASCADE",
      });

      Order.belongsTo(models.tableModel, {
        foreignKey: "tableId",
        as: "table",
        onDelete: "SET NULL",
      });
    }
  }

  Order.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      tableId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "cancelled"),
        defaultValue: "pending",
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "failed"),
        defaultValue: "pending",
      },
      paymentMethod: {
        type: DataTypes.ENUM("cash", "card", "online"),
        defaultValue: "cash",
      },
      orderType: {
        type: DataTypes.ENUM("dineIn", "takeaway"),
        allowNull: false,
      },
      isGuestOrder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      orderNumber: {
        type: DataTypes.UUID,
        unique: true,
        defaultValue: Sequelize.UUIDV4,
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      orderNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estimatedTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderStartTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      orderFinishTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      indexes: [
        { fields: ["customerId"] },
        { fields: ["tableId"] },
        { fields: ["sessionId"] },
        { fields: ["orderNumber"] },
        { fields: ["status"] },
        { fields: ["tableId", "sessionId"] },
      ],
    },
  );

  return Order;
};
