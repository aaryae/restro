const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Banner extends Model {
    static associate(models) {
      this.hasMany(models.bannerItemsModel, {
        foreignKey: "bannerId",
        as: "bannerItems",
      });
    }
  }

  Banner.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      responsiveSettings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      sliderSettings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      video_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Banner",
      tableName: "banners",
      indexes: [
        {
          unique: true,
          fields: ["slug"],
          name: "banner_slug_index",
        },
      ],
    },
  );
  return Banner;
};
