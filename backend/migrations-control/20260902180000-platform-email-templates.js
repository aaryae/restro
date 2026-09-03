"use strict";

/** Custom overrides for platform cafe lifecycle emails (public schema). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: "platform_email_templates", schema: "public" },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        templateKey: {
          type: Sequelize.STRING(64),
          allowNull: false,
          unique: true,
        },
        subject: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        bodyHtml: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        bodyText: {
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
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable({
      tableName: "platform_email_templates",
      schema: "public",
    });
  },
};
