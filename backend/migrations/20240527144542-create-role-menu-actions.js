"use strict";
const { REQUEST_METHOD } = require("../constants/value-constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("role_menu_actions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      list: {
        type: Sequelize.STRING,
      },
      clientPath: {
        type: Sequelize.STRING,
      },
      serverPath: {
        type: Sequelize.STRING,
      },
      requestMethod: {
        type: Sequelize.ENUM(...REQUEST_METHOD),
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      roleMenuId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "role_menus",
          key: "id",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("role_menu_actions");
  },
};
