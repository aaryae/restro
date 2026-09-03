const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class StockGroup extends Model {
    static associate(models) {
      StockGroup.hasMany(models.stockItemModel, {
        foreignKey: "stockGroupId",
        as: "stockItems",
      });
    }
  }

  StockGroup.init(
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
      modelName: "StockGroup",
      tableName: "stock_groups",
      timestamps: true,
    },
  );

  return StockGroup;
};
