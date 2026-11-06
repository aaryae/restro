const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ServiceRequest extends Model {
    static associate(models) {
      ServiceRequest.belongsTo(models.tableModel, {
        foreignKey: "tableId",
        as: "table",
        onDelete: "CASCADE",
      });
    }
  }

  ServiceRequest.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      tableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("bill"),
        allowNull: false,
        defaultValue: "bill",
      },
      status: {
        type: DataTypes.ENUM("open", "handled", "cancelled"),
        allowNull: false,
        defaultValue: "open",
      },
      handledBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      handledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "ServiceRequest",
      tableName: "service_requests",
      indexes: [
        { fields: ["tableId", "status"] },
        { fields: ["status", "createdAt"] },
      ],
    },
  );

  return ServiceRequest;
};
