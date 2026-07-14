const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class TrashItem extends Model {
    static associate() {}
  }

  TrashItem.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      resourceType: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      resourceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deletedByName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TrashItem",
      tableName: "trash_items",
    },
  );

  return TrashItem;
};
