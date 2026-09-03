const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class MeasuringUnit extends Model {
    static associate(models) {
      MeasuringUnit.hasMany(models.stockItemModel, {
        foreignKey: "measuringUnitId",
        as: "stockItems",
      });
    }
  }

  MeasuringUnit.init(
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
      symbol: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "MeasuringUnit",
      tableName: "measuring_units",
      timestamps: true,
    },
  );

  return MeasuringUnit;
};
