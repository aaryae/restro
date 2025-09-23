const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Purchase extends Model {
    static associate(models) {
      Purchase.belongsTo(models.supplierModel, {
        foreignKey: "supplierId",
        as: "supplier",
      });
      Purchase.belongsTo(models.accountModel, {
        foreignKey: "accountId",
        as: "account",
      });
      Purchase.belongsTo(models.userModel, {
        foreignKey: "paidByUserId",
        as: "paidByUser",
      });
      Purchase.belongsTo(models.userModel, {
        foreignKey: "enteredByUserId",
        as: "enteredByUser",
      });
      Purchase.hasMany(models.purchaseItemModel, {
        foreignKey: "purchaseId",
        as: "purchaseItems",
      });
    }
  }

  Purchase.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "suppliers", key: "id" },
      },
      invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentTerms: {
        type: DataTypes.ENUM("cash", "cheque", "credit"),
        allowNull: false,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "accounts", key: "id" },
      },
      billPhotoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paidByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
      },
      enteredByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      taxAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: { min: 0.0 },
      },
      status: {
        type: DataTypes.ENUM("draft", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: true, // Set when credit payment is made
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Purchase",
      tableName: "purchases",
      timestamps: true,
    },
  );

  return Purchase;
};
