"use strict";

/**
 * Staff POS usernames are unique per cafe schema, not platform-wide.
 * Drop legacy global_usernames rows claimed with source = 'tenant'.
 * Trial / platform usernames remain globally unique.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM public.global_usernames
      WHERE source = 'tenant'
    `);
  },

  async down() {
    // Cannot restore released claims safely.
  },
};
