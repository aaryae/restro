const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Department extends Model {
    static associate(models) {
      Department.hasMany(models.orderItemModel, {
        foreignKey: "departmentId",
        as: "orderItems",
        onDelete: "SET NULL",
      });
      Department.hasMany(models.openItemModel, {
        foreignKey: "departmentId",
        as: "openItems",
        onDelete: "SET NULL",
      });
    }
  }

  Department.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      AvgPreparationTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0 },
        comment: "Average preparation time in minutes for this department",
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0 },
        comment: "Order for displaying departments in UI",
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          is: /^#[0-9A-F]{6}$/i,
        },
        comment: "Hex color code for department identification in UI",
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Department",
      tableName: "departments",
      indexes: [
        { fields: ["name"] },
        { fields: ["isActive"] },
        { fields: ["displayOrder"] },
      ],
    },
  );

  return Department;
};
