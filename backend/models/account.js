const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Account extends Model {
    static associate(models) {
      Account.hasMany(models.revenueModel, {
        foreignKey: "accountId",
        as: "revenues",
      });
      Account.hasOne(models.bankAccountModel, {
        foreignKey: "accountId",
        as: "bankAccount",
      });
      Account.hasOne(models.cashAccountModel, {
        foreignKey: "accountId",
        as: "cashAccount",
      });
      Account.hasOne(models.walletAccountModel, {
        foreignKey: "accountId",
        as: "walletAccount",
      });
    }
  }

  Account.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      accountType: {
        type: DataTypes.ENUM("cash", "bank", "wallet"),
        allowNull: false,
        defaultValue: "cash",
      },
      openingBalance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      currentBalance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "Account",
      tableName: "accounts",
      timestamps: true,
      indexes: [{ fields: ["accountType"] }],
    },
  );

  return Account;
};
