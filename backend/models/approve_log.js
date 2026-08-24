"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ApprovalLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define relationship with ActionRequest
      this.belongsTo(models.actionRequestModel, {
        foreignKey: "requestId",
        as: "request",
      });

      // Define relationship with User (approvedBy)
      this.belongsTo(models.userModel, {
        foreignKey: "approvedById",
        as: "approvedBy",
      });
    }
  }

  ApprovalLog.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      approvedById: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      actionTaken: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ApprovalLog",
    },
  );

  return ApprovalLog;
};
