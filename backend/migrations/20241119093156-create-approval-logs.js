"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ApprovalLogs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      requestId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ActionRequests",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      approvedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      actionTaken: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      comments: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex("ApprovalLogs", ["requestId"]);
    await queryInterface.addIndex("ApprovalLogs", ["approvedById"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("ApprovalLogs");
  },
};
