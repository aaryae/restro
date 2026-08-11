"use strict";

/** Postgres UUID rejects values like ORD-123. Display numbers are strings. */
module.exports = {
  async up(queryInterface) {
    const schema = queryInterface._tenantSchema || "public";
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."orders" ALTER COLUMN "orderNumber" TYPE VARCHAR(255) USING "orderNumber"::text`,
    );
  },

  async down(queryInterface) {
    const schema = queryInterface._tenantSchema || "public";
    await queryInterface.sequelize.query(
      `ALTER TABLE "${schema}"."orders" ALTER COLUMN "orderNumber" TYPE UUID USING "orderNumber"::uuid`,
    );
  },
};
