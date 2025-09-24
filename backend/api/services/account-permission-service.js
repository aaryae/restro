const { Op } = require("sequelize");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const { sequelize, accountPermissionModel } = require("../../models");

const list = async (req) => {
  try {
    const { page = 1, limit = 10, accountId, userId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (accountId) whereClause.accountId = accountId;
    if (userId) whereClause.userId = userId;

    const { count, rows } = await req.db.accountPermissionModel.findAndCountAll(
      {
        where: whereClause,
        include: [
          {
            model: req.db.userModel,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email"],
          },
          {
            model: req.db.accountModel,
            as: "account",
            attributes: ["id", "name", "code"],
          },
        ],
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [["createdAt", "DESC"]],
        distinct: true,
      },
    );

    return {
      status: 200,
      success: true,
      data: {
        items: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const getById = async (req) => {
  try {
    const { id } = req.params;
    const permission = await req.db.accountPermissionModel.findByPk(id, {
      include: [
        {
          model: req.db.userModel,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: req.db.accountModel,
          as: "account",
          attributes: ["id", "name", "code"],
        },
      ],
    });

    if (!permission) {
      return {
        status: 404,
        success: false,
        message: "Account permission not found",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Account permission retrieved successfully",
      data: permission,
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, accountId, canView, canEdit, canDelete } = req.body;

    // Check if permission already exists
    const existingPermission = await accountPermissionModel.findOne({
      where: { userId, accountId },
      transaction,
    });

    if (existingPermission) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Permission already exists for this user and account",
      };
    }

    const newPermission = await accountPermissionModel.create(
      {
        userId,
        accountId,
        canView: canView || false,
        canEdit: canEdit || false,
        canDelete: canDelete || false,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: "Account permission created successfully",
      data: newPermission,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(error);
    throw error;
  }
};

const update = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { canView, canEdit, canDelete } = req.body;

    const permission = await accountPermissionModel.findByPk(id, {
      transaction,
    });

    if (!permission) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Account permission not found",
      };
    }

    const updatedPermission = await permission.update(
      {
        canView: canView !== undefined ? canView : permission.canView,
        canEdit: canEdit !== undefined ? canEdit : permission.canEdit,
        canDelete: canDelete !== undefined ? canDelete : permission.canDelete,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Account permission updated successfully",
      data: updatedPermission,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(error);
    throw error;
  }
};

const remove = async (req) => {
  const transaction = await req.db.sequelize.transaction();
  try {
    const { id } = req.params;

    const permission = await req.db.accountPermissionModel.findByPk(id, {
      transaction,
    });

    if (!permission) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Account permission not found",
      };
    }

    await permission.destroy({ transaction });
    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Account permission deleted successfully",
      data: { id: Number(id) },
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(error);
    throw error;
  }
};

const getByUserId = async (req) => {
  try {
    const { userId } = req.params;

    const permissions = await req.db.accountPermissionModel.findAll({
      where: { userId },
      include: [
        {
          model: req.db.accountModel,
          as: "account",
          attributes: ["id", "name", "code"],
        },
      ],
    });

    return {
      status: 200,
      success: true,
      message: "User account permissions retrieved successfully",
      data: permissions,
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getByUserId,
};
