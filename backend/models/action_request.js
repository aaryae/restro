"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ActionRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define relationship with User
      this.belongsTo(models.userModel, {
        foreignKey: "userId",
        as: "user",
      });

      // Define relationship with ApprovalLog
      this.hasMany(models.approvalLogModel, {
        foreignKey: "actionRequestId",
        as: "approvals",
      });
    }
  }

  ActionRequest.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requestedAction: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      endpoint: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      params: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      query: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      requestBody: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ActionRequest",
    },
  );

  return ActionRequest;
};
