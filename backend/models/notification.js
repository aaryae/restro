const { Sequelize, DataTypes } = require("sequelize");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      this.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }
  Notification.init(
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
          model: "users",
          key: "id",
        },
      },
      senderId: {
        type: DataTypes.INTEGER, // The user who triggered the notification
        allowNull: true, // Optional (some notifications might be system-generated)
        references: {
          model: "users",
          key: "id",
        },
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("Approval_Request", "Approved", "Rejected"),
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      request_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      sequelize,
      tableName: "notifications",
      modelName: "notification",
    },
  );

  return Notification;
};
