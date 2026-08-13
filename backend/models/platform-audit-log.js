"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class platform_audit_logs extends Model {
    static associate(models) {
      this.belongsTo(models.platformUserModel, {
        foreignKey: "platformUserId",
        as: "actor",
      });
      this.belongsTo(models.tenantModel, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }

  platform_audit_logs.init(
    {
      platformUserId: { type: DataTypes.INTEGER, allowNull: true },
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      action: { type: DataTypes.STRING(64), allowNull: false },
      meta: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      sequelize,
      modelName: "platformAuditLog",
      tableName: "platform_audit_logs",
      schema: "public",
    },
  );

  return platform_audit_logs;
};
