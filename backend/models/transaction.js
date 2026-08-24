const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      // Link to the account for the transaction
      Transaction.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });

      // Link to the user who performed the transaction
      Transaction.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Transaction.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Accounts", key: "id" },
        comment: "The account for the transaction",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        comment: "The user who performed the transaction",
      },
      type: {
        type: DataTypes.ENUM("deposit", "withdraw"),
        allowNull: false,
        comment: "Transaction type: deposit or withdraw",
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0.01,
          isDecimal: true,
        },
        comment: "Transaction amount",
      },
      transactionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Date and time of transaction",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional notes or reason for transaction",
      },
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions",
      timestamps: true,
      indexes: [
        { fields: ["accountId"] },
        { fields: ["userId"] },
        { fields: ["type"] },
        { fields: ["transactionDate"] },
      ],
    },
  );

  return Transaction;
};
