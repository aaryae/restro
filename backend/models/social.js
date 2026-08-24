const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Social extends Model {
    static associate(models) {
      // Each Social belongs to one Setting
      Social.belongsTo(models.settingModel, {
        foreignKey: "settingId",
        as: "setting",
        onDelete: "CASCADE",
      });

      // One Social can have many SocialMedia entries
    }
  }

  Social.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      social_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      social_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fav_icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      settingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Social",
      tableName: "socials",
    },
  );

  return Social;
};
