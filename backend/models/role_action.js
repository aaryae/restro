"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RoleAction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.roleMenuActionModel, {
        foreignKey: "roleMenuActionId",
        targetKey: "id",
      });
      this.belongsTo(models.roleModel, {
        foreignKey: "roleId",
        targetKey: "id",
      });
    }
  }
  RoleAction.init(
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
      requiredApproval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        references: {
          model: "roles",
          key: "id",
        },
      },
      roleMenuActionId: {
        type: DataTypes.INTEGER,
        references: {
          model: "role_menu_actions",
          key: "id",
        },
      },
      createdBy: {
        type: DataTypes.INTEGER,
      },
      editedBy: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "role_action",
    },
  );
  return RoleAction;
};
