const { Model, DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  class Expense extends Model {
    static associate(models) {
      Expense.belongsTo(models.expenseCategoryModel, {
        foreignKey: "categoryId",
        as: "category",
        onDelete: "SET NULL",
      });
      Expense.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
      Expense.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
      Expense.belongsTo(models.accountModel, {
        foreignKey: "paymentAccountId",
        as: "paymentAccount",
      });
    }
  }

  Expense.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      cash_or_credit: {
        type: DataTypes.ENUM("cash", "credit"),
        defaultValue: "cash",
      },
      paymentMethod: {
        type: DataTypes.ENUM("cash", "card", "online"),
        defaultValue: "cash",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "expense_categories", key: "id" },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "accounts", key: "id" },
      },
      paymentAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "accounts", key: "id" },
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Expense",
      tableName: "expenses",
      timestamps: true,
      indexes: [{ fields: ["accountId"] }, { fields: ["categoryId"] }],
    },
  );

  // Hook to update currentBalance for cash expenses
  Expense.addHook("afterCreate", async (expense, options) => {
    try {
      if (expense.cash_or_credit === "cash") {
        if (!expense.accountId) {
          throw new Error("accountId is required for expense");
        }

        const account = await expense.getAccount({
          transaction: options.transaction,
        });

        if (!account) {
          throw new Error(
            `Associated account not found for accountId: ${expense.accountId}`,
          );
        }

        const newBalance =
          Number(account.currentBalance) - Number(expense.amount);

        if (newBalance < 0) {
          throw new Error("Insufficient account balance");
        }

        await account.update(
          {
            currentBalance: newBalance,
          },
          { transaction: options.transaction },
        );
      }
    } catch (error) {
      console.error(
        `[Expense Hook] Error in afterCreate for expense ID: ${expense.id}`,
        error.message,
      );
      throw error; // Ensure transaction rollback
    }
  });

  return Expense;
};
