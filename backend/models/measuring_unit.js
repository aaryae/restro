const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class MeasuringUnit extends Model {
    static associate(models) {
      MeasuringUnit.hasMany(models.stockItemModel, {
        foreignKey: "measuringUnitId",
        as: "stockItems",
      });
      MeasuringUnit.belongsTo(models.measuringUnitModel, {
        foreignKey: "equalsUnitId",
        as: "equalsUnit",
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
      equalsUnitId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "measuring_units", key: "id" },
      },
      equalsFactor: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: true,
      },
      equalsCount: {
        type: DataTypes.DECIMAL(14, 4),
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
