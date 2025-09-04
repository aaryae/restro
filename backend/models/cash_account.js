const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class CashAccount extends Model {
    static associate(models) {
      CashAccount.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
    }
  }

  CashAccount.init(
    {
      accountId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "Accounts", key: "id" },
      },
    },
    {
      sequelize,
      modelName: "cashAccount",
      tableName: "cash_accounts",
      timestamps: true,
    },
  );

  return CashAccount;
};
