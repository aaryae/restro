"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MediaCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      MediaCategory.hasMany(models.mediaModel, {
        foreignKey: "mediaCategoryId",
        as: "media",
      });
    }
  }
  MediaCategory.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: DataTypes.STRING,
      slug: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
    },
    {
      timestamps: true,
      sequelize,
      modelName: "MediaCategory",
      tableName: "media_categories",
    },
  );
  return MediaCategory;
};
