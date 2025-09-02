const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class BankAccount extends Model {
    static associate(models) {
      BankAccount.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
    }
  }

  BankAccount.init(
    {
      accountId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "Accounts", key: "id" },
      },
      bankAccountName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bankAccountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "bankAccount",
      tableName: "bank_accounts",
      timestamps: true,
    },
  );

  return BankAccount;
};
