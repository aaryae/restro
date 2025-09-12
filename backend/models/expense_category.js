const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ExpenseCategory extends Model {
    static associate(models) {
      ExpenseCategory.hasMany(models.expenseModel, {
        foreignKey: "categoryId",
        as: "expenses",
      });
    }
  }

  ExpenseCategory.init(
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
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "ExpenseCategory",
      tableName: "expense_categories",
      timestamps: true,
    },
  );

  return ExpenseCategory;
};
