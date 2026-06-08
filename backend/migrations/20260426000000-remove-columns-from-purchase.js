'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [foreignKeys] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME
         FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'purchases'
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'
           AND CONSTRAINT_NAME LIKE '%paidByUserId%'`,
        { transaction }
      );

      for (const { CONSTRAINT_NAME } of foreignKeys) {
        await queryInterface.sequelize.query(
          `ALTER TABLE purchases DROP FOREIGN KEY \`${CONSTRAINT_NAME}\``,
          { transaction }
        );
      }

      await queryInterface.removeColumn('purchases', 'billPhotoUrl', { transaction });
      await queryInterface.removeColumn('purchases', 'paidByUserId', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('purchases', 'billPhotoUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('purchases', 'paidByUserId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};