"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RoleMenu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.roleMenuActionModel, {
        foreignKey: "roleMenuId",
      });
      // define association here
    }
  }
  RoleMenu.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      title: {
        type: DataTypes.STRING,
      },
      key: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "role_menu",
    },
  );
  return RoleMenu;
};
