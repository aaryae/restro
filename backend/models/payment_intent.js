const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PaymentIntent extends Model {
    static associate(models) {
      PaymentIntent.belongsTo(models.orderModel, {
        foreignKey: "orderId",
        as: "order",
        onDelete: "CASCADE",
      });
      PaymentIntent.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
        onDelete: "SET NULL",
      });
      PaymentIntent.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
      PaymentIntent.hasMany(models.revenueModel, {
        foreignKey: "paymentIntentId",
        as: "revenues",
      });
    }
  }

  PaymentIntent.init(
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
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: "NPR",
      },
      merchantTxnRef: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      /** Bill number inside NCHL qrString (EMV tag 62-01) — used for nqrws settlement matching. */
      nchlBillNumber: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      gatewayTxnId: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "paid",
          "failed",
          "expired",
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      qrPayload: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      qrImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      attempt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      rawInitiateResponse: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      rawConfirmPayload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PaymentIntent",
      tableName: "payment_intents",
      timestamps: true,
      indexes: [
        { fields: ["orderId"] },
        { fields: ["status"] },
        { fields: ["merchantTxnRef"], unique: true },
        { fields: ["nchlBillNumber"] },
        { fields: ["gatewayTxnId"], unique: true },
      ],
    },
  );

  return PaymentIntent;
};
