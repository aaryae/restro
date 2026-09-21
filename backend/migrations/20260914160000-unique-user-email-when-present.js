"use strict";

/**
 * Staff email is optional, but when set it must be unique within the cafe.
 * Uses the tenant schema from the multi-tenant migration runner.
 */
module.exports = {
  async up(queryInterface) {
    const schema =
      queryInterface._tenantSchema ||
      queryInterface.sequelize?.options?.schema ||
      "public";
    const indexName = `${String(schema).replace(/-/g, "_")}_users_email_unique_not_null`;

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "${indexName}"
      ON "${schema}"."users" (LOWER(email))
      WHERE email IS NOT NULL AND BTRIM(email) <> ''
    `);
  },

  async down(queryInterface) {
    const schema =
      queryInterface._tenantSchema ||
      queryInterface.sequelize?.options?.schema ||
      "public";
    const indexName = `${String(schema).replace(/-/g, "_")}_users_email_unique_not_null`;

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "${schema}"."${indexName}"
    `);
  },
};
