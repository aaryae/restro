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
    },
    {
      sequelize,
      modelName: "Revenue",
      tableName: "revenues",
      timestamps: true,
      indexes: [{ fields: ["customerId"] }],
    },
  );

  return Revenue;
};
