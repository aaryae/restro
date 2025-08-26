"use strict";
const { Model } = require("sequelize");
const { GENDER } = require("../constants/value-constants");
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      // Customer.hasMany(models.orderModel, {
      //   foreignKey: "customerId",
      //   as: "orders",
      // });
      Customer.hasMany(models.orderModel, {
        foreignKey: "customerId",
        as: "orders",
      });
      // define association here
    }
  }
  Customer.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      firstName: {
        type: DataTypes.STRING,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      gender: {
        type: DataTypes.ENUM(...GENDER),
        allowNull: true,
      },
      mobileNo: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Customer",
      tableName: "customers",
    },
  );
  return Customer;
};

//customer guest user details
// after customer create put on user model
//
