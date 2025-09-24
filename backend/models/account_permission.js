const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class AccountPermission extends Model {
    static associate(models) {
      AccountPermission.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
      AccountPermission.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
    }
  }

  AccountPermission.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users", // Assuming your User table is named "users"
          key: "id",
        },
        onDelete: "CASCADE",
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "accounts",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      canView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canDelete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "AccountPermission",
      tableName: "account_permissions",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["userId", "accountId"] }, // Prevent duplicate permissions per user-account pair
      ],
    },
  );

  return AccountPermission;
};
