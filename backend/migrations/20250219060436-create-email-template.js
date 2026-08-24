"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("email_templates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      templateName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      templateKey: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      activeTemplateId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alternateText: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("email_templates");
  },
};
