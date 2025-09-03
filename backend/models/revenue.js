const { Model, DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
  class Revenue extends Model {
    static associate(models) {
      Revenue.belongsTo(models.customerModel, {
        foreignKey: "customerId",
        as: "customer",
        onDelete: "SET NULL",
      });

      Revenue.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });

      Revenue.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
    }
  }

  Revenue.init(
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
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Revenue",
      tableName: "revenues",
      timestamps: true,
      indexes: [{ fields: ["accountId"] }, { fields: ["customerId"] }],
    },
  );

  // Hook to update currentBalance
  Revenue.addHook("afterCreate", async (revenue, options) => {
    try {
      if (!revenue.accountId) {
        throw new Error("accountId is required for revenue");
      }

      const account = await revenue.getAccount({
        transaction: options.transaction,
      });

      if (!account) {
        throw new Error(
          `Associated account not found for accountId: ${revenue.accountId}`,
        );
      }

      const newBalance =
        Number(account.currentBalance) + Number(revenue.amount);

      await account.update(
        {
          currentBalance: newBalance,
        },
        { transaction: options.transaction },
      );
    } catch (error) {
      console.error(
        `[Revenue Hook] Error in afterCreate for revenue ID: ${revenue.id}`,
        error.message,
      );
      throw error; // Re-throw to ensure transaction rollback
    }
  });

  return Revenue;
};
