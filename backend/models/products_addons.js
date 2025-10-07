const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductAddon = sequelize.define('ProductAddon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    addonId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'addons',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, {
    tableName: 'products_addons',
    timestamps: true,
  });

  return ProductAddon;
};