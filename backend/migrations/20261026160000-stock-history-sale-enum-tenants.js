"use strict";

/**
 * sale / sale_reversal were added on public.enum_stock_histories_type only.
 * Tenant schemas keep their own enum, so order stock deduction failed with
 * "invalid input value for enum enum_stock_histories_type: sale".
 * Qualify every schema so search_path cannot send this at public.
 */
module.exports = {
  async up(queryInterface) {
    const [types] = await queryInterface.sequelize.query(`
      SELECT n.nspname AS schema
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'enum_stock_histories_type'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    `);

    for (const { schema } of types) {
      const typeName = `"${schema}"."enum_stock_histories_type"`;
      await queryInterface.sequelize.query(
        `ALTER TYPE ${typeName} ADD VALUE IF NOT EXISTS 'sale'`,
      );
      await queryInterface.sequelize.query(
        `ALTER TYPE ${typeName} ADD VALUE IF NOT EXISTS 'sale_reversal'`,
      );
    }
  },

  async down() {},
};
