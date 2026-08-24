"use strict";
const { Model } = require("sequelize");
const { REQUEST_METHOD } = require("../constants/value-constants");
module.exports = (sequelize, DataTypes) => {
  class RoleMenuAction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.roleMenuModel, {
        foreignKey: "roleMenuId",
        targetKey: "id",
      });
      this.hasMany(models.roleActionModel, {
        foreignKey: "roleMenuActionId",
        targetKey: "id",
      });
    }
  }
  RoleMenuAction.init(
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
      list: {
        type: DataTypes.STRING,
      },
      roleMenuId: {
        type: DataTypes.INTEGER,
        references: {
          model: "role_menus",
          key: "id",
        },
      },
      clientPath: {
        type: DataTypes.STRING,
      },
      serverPath: {
        type: DataTypes.STRING,
      },
      requestMethod: {
        type: DataTypes.ENUM(...REQUEST_METHOD),
      },
    },
    {
      sequelize,
      modelName: "role_menu_action",
    },
  );
  return RoleMenuAction;
};
