const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Floor extends Model {
    static associate(models) {
      Floor.hasMany(models.tableModel, {
        foreignKey: "floorId",
        as: "tables",
        onDelete: "CASCADE",
      });
    }
  }

  Floor.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      floorNo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Floor",
      tableName: "floors",
    },
  );

  return Floor;
};
