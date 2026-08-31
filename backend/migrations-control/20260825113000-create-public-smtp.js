"use strict";

/**
 * Platform Serve OTP / system mail uses public.smtp (no tenant context).
 * Cafe POS SMTP remains in each tenant schema via tenant migrations.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'smtp'
       LIMIT 1`,
    );
    if (rows.length) return;

    await queryInterface.createTable(
      { tableName: "smtp", schema: "public" },
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        passkey: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        host: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        port: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        secure: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
    const [rows] = await queryInterface.sequelize.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'smtp'
       LIMIT 1`,
    );
    if (!rows.length) return;
    await queryInterface.dropTable({ tableName: "smtp", schema: "public" });
  },
};
