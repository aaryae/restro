const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class WalletAccount extends Model {
    static associate(models) {
      WalletAccount.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
    }
  }

  WalletAccount.init(
    {
      accountId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "Accounts", key: "id" },
      },
      walletAccountName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      walletId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "walletAccount",
      tableName: "wallet_accounts",
      timestamps: true,
    },
  );

  return WalletAccount;
};
