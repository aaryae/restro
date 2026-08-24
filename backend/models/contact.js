const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    static associate(models) {}
  }
  Contact.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      tableName: "contacts",
      modelName: "Contact",
    },
  );
  return Contact;
};
