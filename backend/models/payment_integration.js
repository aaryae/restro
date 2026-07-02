const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class PaymentIntegration extends Model {
    static associate(models) {
      // Optional link to the Cash & Banks account this integration pays into.
      // This replaces the fragile name-based NEPALPAY detection at checkout.
      PaymentIntegration.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
        onDelete: "SET NULL",
      });
    }
  }

  PaymentIntegration.init(
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
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "nepalpay",
      },
      // Cash & Banks account this integration is bound to ("Payment Mode" dropdown).
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // --- Non-secret merchant identity (maps to MACHBANK_* env) ---
      merchantId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      merchantCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchantCategoryCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchantName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      acquirerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchantCity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      merchantPostalCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      npiUsername: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // --- Encrypted secrets (AES-256-GCM via secret-box) ---
      passwordEnc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      webhookTokenEnc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      npiPrivateKeyEnc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Only one active integration per provider is used at runtime.
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "PaymentIntegration",
      tableName: "payment_integrations",
    },
  );

  return PaymentIntegration;
};
