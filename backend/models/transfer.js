const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Transfer extends Model {
    static associate(models) {
      Transfer.belongsTo(models.accountModel, {
        foreignKey: "fromAccountId",
        as: "fromAccount",
      });
      Transfer.belongsTo(models.accountModel, {
        foreignKey: "toAccountId",
        as: "toAccount",
      });
      Transfer.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Transfer.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      fromAccountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Accounts", key: "id" },
      },
      toAccountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Accounts", key: "id" },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      transferDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Transfer",
      tableName: "transfers",
      timestamps: true,
      indexes: [
        { fields: ["fromAccountId"] },
        { fields: ["toAccountId"] },
        { fields: ["userId"] },
      ],
    },
  );

  return Transfer;
};
