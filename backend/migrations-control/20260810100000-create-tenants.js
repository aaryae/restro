"use strict";

const { TENANT_STATUSES } = require("../constants/tenant-constants");

/** Control-plane table: one row per cafe (lives in public schema). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tenants", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      slug: {
        type: Sequelize.STRING(63),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      schemaName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM(...TENANT_STATUSES),
        allowNull: false,
        defaultValue: "provisioning",
      },
      trialEndsAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      activatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      hostingEndsAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ownerEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ownerPhone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tenants");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_tenants_status";',
    );
  },
};
