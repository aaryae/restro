const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class OpenItemMedia extends Model {
    static associate(models) {
      OpenItemMedia.belongsTo(models.openItemModel, {
        foreignKey: "openItemId",
        as: "open_item",
      });
    }
  }

  OpenItemMedia.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      openItemId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "OpenItemMedia",
      tableName: "open_item_media",
    },
  );

  return OpenItemMedia;
};
