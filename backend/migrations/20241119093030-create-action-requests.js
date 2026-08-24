"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ActionRequests", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      requestedAction: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      endpoint: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      params: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      query: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      requestBody: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("ActionRequests", ["status"]);
    await queryInterface.addIndex("ActionRequests", ["userId"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ActionRequests");
  },
};
