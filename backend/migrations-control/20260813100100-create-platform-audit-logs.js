"use strict";

/** Who activated / suspended / impersonated which cafe. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("platform_audit_logs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      platformUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "platform_users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      tenantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      action: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      meta: {
        type: Sequelize.JSONB,
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

    await queryInterface.addIndex("platform_audit_logs", ["action"]);
    await queryInterface.addIndex("platform_audit_logs", ["tenantId"]);
    await queryInterface.addIndex("platform_audit_logs", ["createdAt"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("platform_audit_logs");
  },
};
