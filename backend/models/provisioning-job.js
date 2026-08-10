"use strict";

const { Model } = require("sequelize");

const PROVISIONING_JOB_STATUSES = ["pending", "running", "success", "failed"];

module.exports = (sequelize, DataTypes) => {
  class provisioning_jobs extends Model {
    static associate(models) {
      this.belongsTo(models.tenantModel, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }

  provisioning_jobs.init(
    {
      tenantId: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM(...PROVISIONING_JOB_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      finishedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "provisioningJob",
      tableName: "provisioning_jobs",
    },
  );

  return provisioning_jobs;
};
