"use strict";
const { Model } = require("sequelize");
const { ROLE_TYPES } = require("../constants/value-constants");
module.exports = (sequelize, DataTypes) => {
  class roles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.roleActionModel, {
        foreignKey: "roleId",
        targetKey: "id",
      });
      this.hasMany(models.userModel, {
        foreignKey: "roleId",
        targetKey: "id",
      });
      // define association here
    }
  }
  roles.init(
    {
      title: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
      roleType: { type: DataTypes.ENUM(...ROLE_TYPES) },
    },
    {
      sequelize,
      modelName: "role",
    },
  );
  return roles;
};
