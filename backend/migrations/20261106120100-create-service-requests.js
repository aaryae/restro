"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("service_requests", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tableId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tables",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM("bill"),
        allowNull: false,
        defaultValue: "bill",
      },
      status: {
        type: Sequelize.ENUM("open", "handled", "cancelled"),
        allowNull: false,
        defaultValue: "open",
      },
      handledBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      handledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      note: {
        type: Sequelize.STRING(255),
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
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("service_requests", ["tableId", "status"]);
    await queryInterface.addIndex("service_requests", ["status", "createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("service_requests");
  },
};
