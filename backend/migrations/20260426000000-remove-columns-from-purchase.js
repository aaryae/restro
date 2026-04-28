'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // First, remove foreign key constraint if exists
      await queryInterface.sequelize.query(
        'ALTER TABLE purchases DROP FOREIGN KEY IF EXISTS purchases_paidByUserId_foreign_idx',
        { transaction }
      );
      
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