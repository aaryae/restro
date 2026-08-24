const { Model, DataTypes } = require("sequelize");
const { sequelize } = require(".");

module.exports = (sequelize, DataTypes) => {
  class BannerItems extends Model {
    static associate(models) {
      this.belongsTo(models.bannerModel, {
        foreignKey: "bannerId",
      });
    }
  }
  BannerItems.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      caption: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      captionCSS: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      titleCSS: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subTitleCSS: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      primaryButton: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      primaryButtonUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secondaryButton: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secondaryButtonUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      sequelize,
      tableName: "banner_items",
      modelName: "BannerItems",
    },
  );
  return BannerItems;
};
