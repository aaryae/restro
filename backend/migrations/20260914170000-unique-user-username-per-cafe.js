"use strict";

/**
 * Enforce case-insensitive unique staff usernames within each cafe schema.
 * Soft-deleted rows do not block reuse of the same username.
 */
module.exports = {
  async up(queryInterface) {
    const schema =
      queryInterface._tenantSchema ||
      queryInterface.sequelize?.options?.schema ||
      "public";
    const safeSchema = String(schema).replace(/"/g, "");
    const indexName = `${String(schema).replace(/-/g, "_")}_users_username_unique_active`;

    // Drop legacy unique constraints/indexes on username if present.
    const [constraints] = await queryInterface.sequelize.query(
      `
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
      WHERE nsp.nspname = :schema
        AND rel.relname = 'users'
        AND con.contype = 'u'
        AND att.attname = 'username'
      `,
      { replacements: { schema: safeSchema } },
    );

    for (const row of constraints) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${safeSchema}"."users" DROP CONSTRAINT IF EXISTS "${row.conname}"`,
      );
    }

    const [indexes] = await queryInterface.sequelize.query(
      `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = :schema
        AND tablename = 'users'
        AND indexdef ILIKE '%UNIQUE%'
        AND (
          indexdef ILIKE '%(username)%'
          OR indexdef ILIKE '%("username")%'
          OR indexdef ILIKE '%(LOWER(username))%'
        )
        AND indexname <> :indexName
      `,
      { replacements: { schema: safeSchema, indexName } },
    );

    for (const row of indexes) {
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "${safeSchema}"."${row.indexname}"`,
      );
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "${indexName}"
      ON "${safeSchema}"."users" (LOWER(username))
      WHERE "isDeleted" = false
    `);
  },

  async down(queryInterface) {
    const schema =
      queryInterface._tenantSchema ||
      queryInterface.sequelize?.options?.schema ||
      "public";
    const safeSchema = String(schema).replace(/"/g, "");
    const indexName = `${String(schema).replace(/-/g, "_")}_users_username_unique_active`;

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "${safeSchema}"."${indexName}"
    `);
  },
};
