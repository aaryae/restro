"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class global_usernames extends Model {
    static associate(models) {
      this.belongsTo(models.tenantModel, {
        foreignKey: "tenantId",
        as: "tenant",
      });
    }
  }

  global_usernames.init(
    {
      username: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      source: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "globalUsername",
      tableName: "global_usernames",
      schema: "public",
    },
  );

  return global_usernames;
};
