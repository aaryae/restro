"use strict";

/**
 * Platform login uses username (not email).
 * Backfills username from old email, then drops email.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("platform_users", "username", {
      type: Sequelize.STRING(64),
      allowNull: true,
      unique: true,
    });

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, email FROM platform_users`,
    );

    const used = new Set();
    for (const row of rows) {
      let base = String(row.email || "")
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 48);
      if (!base) base = `user${row.id}`;
      let candidate = base;
      let n = 0;
      while (used.has(candidate)) {
        n += 1;
        candidate = `${base}${n}`.slice(0, 64);
      }
      used.add(candidate);
      await queryInterface.sequelize.query(
        `UPDATE platform_users SET username = :username WHERE id = :id`,
        { replacements: { username: candidate, id: row.id } },
      );
    }

    await queryInterface.changeColumn("platform_users", "username", {
      type: Sequelize.STRING(64),
      allowNull: false,
      unique: true,
    });

    await queryInterface.removeColumn("platform_users", "email");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("platform_users", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, username FROM platform_users`,
    );
    for (const row of rows) {
      const email = `${row.username}@platform.local`;
      await queryInterface.sequelize.query(
        `UPDATE platform_users SET email = :email WHERE id = :id`,
        { replacements: { email, id: row.id } },
      );
    }

    await queryInterface.changeColumn("platform_users", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.removeColumn("platform_users", "username");
  },
};
