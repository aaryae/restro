"use strict";

/** Speed up actor-filtered audit queries (JOIN on platformUserId). */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("platform_audit_logs", ["platformUserId"], {
      name: "platform_audit_logs_platform_user_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "platform_audit_logs",
      "platform_audit_logs_platform_user_id_idx",
    );
  },
};
