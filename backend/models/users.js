"use strict";
const { Model } = require("sequelize");
const { GENDER } = require("../constants/value-constants");
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.userModel, {
        foreignKey: "supervisorId",
        as: "supervisor", // Alias for the supervisor relation
      });

      // A user can have many subordinates (lower users)
      this.hasMany(models.userModel, {
        foreignKey: "supervisorId",
        as: "subordinates", // Alias for the subordinates relation
      });

      this.hasMany(models.actionRequestModel, {
        foreignKey: "userId",
        as: "actionRequests",
      });
      this.hasMany(models.notificationModel, {
        foreignKey: "userId",
        as: "notifications",
      });
      this.belongsTo(models.roleModel, {
        foreignKey: "roleId",
        as: "roles",
      });
      this.hasMany(models.revenueModel, {
        foreignKey: "userId",
        as: "user",
      });

      // define association here
    }
  }
  users.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
      },
      firstName: {
        type: DataTypes.STRING,
      },
      lastName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      password: {
        type: DataTypes.STRING,
      },
      imageUrl: {
        type: DataTypes.STRING,
      },
      // passwordSetAt: {
      //   type: DataTypes.DATE,
      // },
      gender: {
        type: DataTypes.ENUM(...GENDER),
        allowNull: false,
      },
      // platform: {
      //   type: DataTypes.STRING,
      // },
      // userIdentifier: {
      //   type: DataTypes.STRING,
      // },
      // emailVerificationCode: {
      //   type: DataTypes.INTEGER,
      // },
      // emailVerified: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: false,
      // },
      // emailVerifiedRequestDate: {
      //   type: DataTypes.DATE,
      // },
      // emailVerifiedDate: {
      //   type: DataTypes.DATE,
      // },
      // passwordResetCode: {
      //   type: DataTypes.STRING,
      // },
      // passwordResetRequestDate: {
      //   type: DataTypes.DATE,
      // },
      // lastPasswordChangeDate: {
      //   type: DataTypes.DATE,
      // },
      addedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      // isAddedByAdmin: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: false,
      // },
      // registerMethod: {
      //   type: DataTypes.ENUM(...REGISTRATION_METHOD),
      //   defaultValue: "email",
      // },
      mobileNo: {
        type: DataTypes.STRING,
      },
      mobilePrefix: {
        type: DataTypes.STRING,
      },
      otp: {
        type: DataTypes.INTEGER,
      },
      // otpGeneratedAt: {
      //   type: DataTypes.DATE,
      // },
      // otpVerified: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: false,
      // },
      // otpVerifiedAt: {
      //   type: DataTypes.DATE,
      // },
      // otpVerificationRequestTime: {
      //   type: DataTypes.DATE,
      // },
      roleId: {
        type: DataTypes.INTEGER,
        references: {
          model: "roles",
          key: "id",
        },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
      supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
      },
    },
    {
      sequelize,
      modelName: "user",
    },
  );
  return users;
};

//customer guest user details
// after customer create put on user model
//
