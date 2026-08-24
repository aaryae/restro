"use strict";

const PROVISIONING_JOB_STATUSES = ["pending", "running", "success", "failed"];

/** Tracks async "create a new cafe" work (control plane, public schema). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("provisioning_jobs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM(...PROVISIONING_JOB_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finishedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable("provisioning_jobs");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_provisioning_jobs_status";',
    );
  },
};
