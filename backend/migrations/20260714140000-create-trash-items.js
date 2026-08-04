"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("trash_items", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      resourceType: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      resourceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      displayName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      deletedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      deletedByName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.addIndex("trash_items", ["resourceType"]);
    await queryInterface.addIndex("trash_items", ["createdAt"]);
    await queryInterface.addIndex("trash_items", ["expiresAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("trash_items");
  },
};
