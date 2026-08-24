const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Smtp extends Model {
    static associate(models) {
      // Each Social belongs to one Setting
    }
  }

  Smtp.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passkey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      host: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      secure: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // typically false unless using SSL
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Smtp",
      tableName: "smtp",
    },
  );

  return Smtp;
};
