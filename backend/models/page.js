const { Sequelize, DataTypes } = require("sequelize");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Pages extends Model {
    static associate(models) {}
  }
  Pages.init(
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
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      header_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      page_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      og_image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      og_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      meta_description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      meta_keywords: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      sequelize,
      tableName: "pages",
      modelName: "Page",
    },
  );

  return Pages;
};
