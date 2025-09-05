const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Supplier extends Model {
    // static associate(models) {
    //   // Supplier → Purchase relation
    //   Supplier.hasMany(models.Purchase, {
    //     foreignKey: "id",
    //     as: "purchases",
    //   });
    // }
  }

  Supplier.init(
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
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      pan_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      point_of_contact: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Supplier",
      tableName: "suppliers",
      timestamps: true,
    },
  );

  return Supplier;
};
