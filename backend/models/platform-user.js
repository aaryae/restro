"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class platform_users extends Model {
    static associate(models) {
      this.hasMany(models.platformAuditLogModel, {
        foreignKey: "platformUserId",
        as: "auditLogs",
      });
    }
  }

  platform_users.init(
    {
      username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      platformRole: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: "owner",
      },
      permissions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "platformUser",
      tableName: "platform_users",
      schema: "public",
    },
  );

  return platform_users;
};
