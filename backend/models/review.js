const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {}
  }

  Review.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      desc: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      timestamps: true,
      sequelize,
      modelName: "Review",
      tableName: "reviews",
    },
  );

  return Review;
};
