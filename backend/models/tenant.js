"use strict";

const { Model } = require("sequelize");
const { TENANT_STATUSES } = require("../constants/tenant-constants");

module.exports = (sequelize, DataTypes) => {
  class tenants extends Model {
    static associate(models) {
      this.hasMany(models.provisioningJobModel, {
        foreignKey: "tenantId",
        as: "provisioningJobs",
      });
    }
  }

  tenants.init(
    {
      slug: { type: DataTypes.STRING(63), allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      schemaName: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM(...TENANT_STATUSES),
        allowNull: false,
        defaultValue: "provisioning",
      },
      trialEndsAt: { type: DataTypes.DATE, allowNull: true },
      activatedAt: { type: DataTypes.DATE, allowNull: true },
      hostingEndsAt: { type: DataTypes.DATE, allowNull: true },
      ownerEmail: { type: DataTypes.STRING, allowNull: true },
      ownerPhone: { type: DataTypes.STRING, allowNull: true },
      businessType: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "tenant",
      tableName: "tenants",
      schema: "public",
    },
  );

  return tenants;
};
