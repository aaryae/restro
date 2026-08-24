"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EmailTemplate extends Model {
    static associate(models) {
      this.hasOne(models.activeTemplateModel, {
        foreignKey: "templateId",
        as: "activeTemplate",
      });
    }
  }

  EmailTemplate.init(
    {
      id: {
        autoNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      templateName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      templateKey: {
        type: DataTypes.STRING,
        allowNull: false,
      }, // e.g., "approval", "rejection"
      activeTemplateId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      variables: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      alternateText: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      }, // CKEditor will design this
    },
    {
      timestamps: true,
      sequelize,
      modelName: "EmailTemplate",
      tableName: "email_templates",
    },
  );
  return EmailTemplate;
};
