"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ActiveTemplate extends Model {
    static associate(models) {
      this.belongsTo(models.emailTemplateModel, {
        foreignKey: "templateId",
        as: "emailTemplate",
      });
    }
  }

  ActiveTemplate.init(
    {
      id: {
        autoNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      actionKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      }, // Unique per action
      templateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "ActiveTemplate",
      tableName: "active_templates",
    },
  );
  return ActiveTemplate;
};
