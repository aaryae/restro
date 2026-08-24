const { Sequelize, DataTypes } = require("sequelize");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Seo extends Model {
    static associate(models) {}
  }
  Seo.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pageName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      keywords: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      og_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      og_description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      tableName: "seo",
      modelName: "Seo",
    },
  );

  return Seo;
};
