'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('products_addons', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      addonId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'addons',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add a unique constraint to prevent duplicate entries
    await queryInterface.addConstraint('products_addons', {
      fields: ['productId', 'addonId'],
      type: 'unique',
      name: 'unique_product_addon'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('products_addons');
  }
};
