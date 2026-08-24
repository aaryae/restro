"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class trial_users extends Model {
    static associate(models) {
      this.belongsTo(models.tenantModel, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }

  trial_users.init(
    {
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: false },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      googleId: { type: DataTypes.STRING, allowNull: true, unique: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      tenantId: { type: DataTypes.INTEGER, allowNull: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      otpSecret: { type: DataTypes.STRING, allowNull: true },
      otpExpiresAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "trialUser",
      tableName: "trial_users",
      schema: "public",
    },
  );

  return trial_users;
};
