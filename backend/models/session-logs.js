"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SessionLogs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SessionLogs.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      ipAddress: {
        type: DataTypes.STRING,
      },
      login: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      logout: {
        type: DataTypes.DATE,
      },
      userAgent: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      timestamps: false,
      modelName: "session_logs",
    },
  );
  return SessionLogs;
};
