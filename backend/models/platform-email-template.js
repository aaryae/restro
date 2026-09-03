"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class platform_email_templates extends Model {}

  platform_email_templates.init(
    {
      templateKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      subject: { type: DataTypes.STRING(255), allowNull: false },
      bodyHtml: { type: DataTypes.TEXT, allowNull: false },
      bodyText: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      sequelize,
      modelName: "platformEmailTemplate",
      tableName: "platform_email_templates",
      schema: "public",
    },
  );

  return platform_email_templates;
};
