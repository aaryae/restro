"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Media extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Media.belongsTo(models.mediaCategoryModel, {
        foreignKey: "mediaCategoryId",
        as: "mediaCategory",
      });
    }
  }
  Media.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      mediaCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: DataTypes.STRING,
      path: DataTypes.STRING,
      caption: DataTypes.STRING,
      description: DataTypes.STRING,
      sizeInBytes: DataTypes.STRING(10),
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      mimeType: DataTypes.STRING,
      height: DataTypes.INTEGER,
      width: DataTypes.INTEGER,
      isDeleted: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Media",
      tableName: "media",
    },
  );
  return Media;
};
