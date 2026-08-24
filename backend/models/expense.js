const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Expense extends Model {
    static associate(models) {
      Expense.belongsTo(models.expenseCategoryModel, {
        foreignKey: "categoryId",
        as: "category",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
      Expense.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Expense.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Expense.belongsTo(models.supplierModel, {
        foreignKey: "supplierId",
        as: "supplier",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
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
        validate: {
          isIn: [["cash", "credit"]],
        },
      },
      paymentMethod: {
        type: DataTypes.ENUM("cash", "card", "online"),
        defaultValue: "cash",
        validate: {
          isIn: [["cash", "card", "online"]],
        },
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
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "suppliers", key: "id" },
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
      indexes: [
        { fields: ["accountId"] },
        { fields: ["categoryId"] },
        { fields: ["supplierId"] },
      ],
    },
  );

  // Hook to update account balance for cash or credit expenses
  Expense.addHook("afterCreate", async (expense, options) => {
    try {
      const accountId = expense.accountId;
      if (!accountId) {
        throw new Error("accountId is required for expense");
      }

      // Access the Account model through the sequelize instance
      const AccountModel = sequelize.models.Account;
      if (!AccountModel) {
        throw new Error("Account model not found ****\n***\n***");
      }

      const account = await AccountModel.findByPk(accountId, {
        transaction: options.transaction,
      });

      if (!account || account.status !== "active") {
        throw new Error(
          `Associated account not found or inactive for accountId: ${accountId}`,
        );
      }

      const newBalance =
        Number(account.currentBalance) - Number(expense.amount);
      if (newBalance < 0) {
        throw new Error(
          `Insufficient balance in account ${accountId} for expense ID: ${expense.id}`,
        );
      }

      await account.update(
        { currentBalance: newBalance },
        { transaction: options.transaction },
      );
    } catch (error) {
      console.error(
        `[Expense Hook] Error in afterCreate for expense ID: ${expense.id}`,
        error.stack,
      );
      throw error;
    }
  });

  // Hook to handle balance updates on expense update
  Expense.addHook("afterUpdate", async (expense, options) => {
    try {
      if (!expense.accountId) {
        throw new Error(`accountId is required for expense ID: ${expense.id}`);
      }

      // Access the Account model through the sequelize instance
      const AccountModel = sequelize.models.Account;
      if (!AccountModel) {
        throw new Error("Account model not found");
      }

      const account = await AccountModel.findByPk(expense.accountId, {
        transaction: options.transaction,
      });

      if (!account || account.status !== "active") {
        throw new Error(
          `Associated account not found or inactive for accountId: ${expense.accountId}`,
        );
      }

      // Calculate the difference between old and new amounts
      const oldAmount = Number(expense._previousDataValues.amount) || 0;
      const newAmount = Number(expense.amount) || 0;
      const amountDifference = newAmount - oldAmount;

      // Update account balance
      const newBalance =
        Number(account.currentBalance) - Number(amountDifference);
      if (newBalance < 0) {
        throw new Error(
          `Insufficient balance in account ${expense.accountId} for expense ID: ${expense.id}`,
        );
      }

      await account.update(
        { currentBalance: newBalance },
        { transaction: options.transaction },
      );
    } catch (error) {
      console.error(
        `[Expense Hook] Error in afterUpdate for expense ID: ${expense.id}`,
        error.stack,
      );
      throw error;
    }
  });

  // Hook to handle balance restoration on expense deletion
  Expense.addHook("afterDestroy", async (expense, options) => {
    try {
      if (!expense.accountId) {
        throw new Error(`accountId is required for expense ID: ${expense.id}`);
      }

      // Access the Account model through the sequelize instance
      const AccountModel = sequelize.models.Account;
      if (!AccountModel) {
        throw new Error("Account model not found");
      }

      const account = await AccountModel.findByPk(expense.accountId, {
        transaction: options.transaction,
      });

      if (!account) {
        console.warn(
          `Account not found for accountId: ${expense.accountId} during expense deletion`,
        );
        return;
      }

      // Restore the amount back to account balance
      const newBalance =
        Number(account.currentBalance) + Number(expense.amount);

      await account.update(
        { currentBalance: newBalance },
        { transaction: options.transaction },
      );
    } catch (error) {
      console.error(
        `[Expense Hook] Error in afterDestroy for expense ID: ${expense.id}`,
        error.stack,
      );
      throw error;
    }
  });

  return Expense;
};
