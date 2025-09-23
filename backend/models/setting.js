const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Setting extends Model {
    static associate(models) {
      // One Setting can have many Social entries
      Setting.hasMany(models.socialModel, {
        foreignKey: "settingId", // Foreign key in the Social model
        as: "socials", // Alias for the association
        onDelete: "CASCADE", // Delete socials if the setting is deleted
      });
    }
  }

  Setting.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      brand_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      primary_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      secondary_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mapUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fav_icon: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      brandingImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      brandingFooterImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      footer_desc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      google_analytics: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      primaryColor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      openingBalance: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      pan_vat_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Setting",
      tableName: "settings",
    },
  );

  return Setting;
};
