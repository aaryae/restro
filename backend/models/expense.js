const { Model, DataTypes, Sequelize } = require("sequelize");

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
      Expense.belongsTo(models.accountModel, {
        foreignKey: "paymentAccountId",
        as: "paymentAccount",
        onDelete: "SET NULL",
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
      paymentAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      const accountId =
        expense.cashOrCredit === "cash"
          ? expense.accountId
          : expense.paymentAccountId;
      if (!accountId) {
        throw new Error(
          `${expense.cashOrCredit === "cash" ? "accountId" : "paymentAccountId"} is required for ${expense.cashOrCredit} expense`,
        );
      }

      const account = await sequelize.models.accountModel.findByPk(accountId, {
        transaction: options.transaction,
      });

      if (!account) {
        throw new Error(
          `Associated account not found for accountId: ${accountId}`,
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
        error.message,
      );
      throw error;
    }
  });

  // Hook to handle balance updates on expense update
  Expense.addHook("afterUpdate", async (expense, options) => {
    try {
      const previous = expense._previousDataValues;
      const current = expense.dataValues;
      const accountId =
        expense.cashOrCredit === "cash"
          ? expense.accountId
          : expense.paymentAccountId;

      if (
        previous.amount !== current.amount ||
        previous.accountId !== current.accountId ||
        previous.paymentAccountId !== current.paymentAccountId
      ) {
        const account = await sequelize.models.accountModel.findByPk(
          accountId,
          {
            transaction: options.transaction,
          },
        );

        if (!account) {
          throw new Error(
            `Associated account not found for accountId: ${accountId}`,
          );
        }

        // Revert previous amount and apply new amount
        const revertBalance =
          Number(account.currentBalance) + Number(previous.amount);
        const newBalance = revertBalance - Number(current.amount);

        if (newBalance < 0) {
          throw new Error(
            `Insufficient balance in account ${accountId} for updated expense ID: ${expense.id}`,
          );
        }

        await account.update(
          { currentBalance: newBalance },
          { transaction: options.transaction },
        );
      }
    } catch (error) {
      console.error(
        `[Expense Hook] Error in afterUpdate for expense ID: ${expense.id}`,
        error.message,
      );
      throw error;
    }
  });

  // Hook to restore balance on expense deletion
  Expense.addHook("afterDestroy", async (expense, options) => {
    try {
      const accountId =
        expense.cashOrCredit === "cash"
          ? expense.accountId
          : expense.paymentAccountId;
      if (!accountId) return;

      const account = await sequelize.models.accountModel.findByPk(accountId, {
        transaction: options.transaction,
      });

      if (!account) {
        throw new Error(
          `Associated account not found for accountId: ${accountId}`,
        );
      }

      const newBalance =
        Number(account.currentBalance) + Number(expense.amount);
      await account.update(
        { currentBalance: newBalance },
        { transaction: options.transaction },
      );
    } catch (error) {
      console.error(
        `[Expense Hook] Error in afterDestroy for expense ID: ${expense.id}`,
        error.message,
      );
      throw error;
    }
  });

  return Expense;
};
