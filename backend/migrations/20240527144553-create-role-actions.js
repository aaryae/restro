"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("role_actions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      requiredApproval: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },
      roleMenuActionId: {
        type: Sequelize.INTEGER,
        references: {
          model: "role_menu_actions",
          key: "id",
        },
      },
      createdBy: {
        type: Sequelize.INTEGER,
      },
      editedBy: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable("role_actions");
  },
};
