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
      supplier_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contact_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      pan_vat_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contact_person: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
