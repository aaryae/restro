const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Withdraw extends Model {
    static associate(models) {
      // Link to the account from which withdrawal is made
      Withdraw.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });

      // Link to the user who performed the withdrawal
      Withdraw.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Withdraw.init(
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
        comment: "The account from which withdrawal is made",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        comment: "The user who performed the withdrawal",
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0.01,
          isDecimal: true,
        },
        comment: "Withdrawal amount",
      },
      withdrawalDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "Date and time of withdrawal",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional notes or reason for withdrawal",
      },
    },
    {
      sequelize,
      modelName: "Withdraw",
      tableName: "withdraws",
      timestamps: true,
      indexes: [
        { fields: ["accountId"] },
        { fields: ["userId"] },
        { fields: ["withdrawalDate"] },
      ],
    },
  );

  return Withdraw;
};
