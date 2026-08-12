const {
  roleModel,
  roleActionModel,
  roleMenuActionModel,
  roleMenuModel,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");

const paginate = require("../../utils/paginate");

const getAllAccessModule = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    let { limit, page } = req.query;
    const filters = {};
    const result = await paginate(roleMenuModel, {
      limit,
      page,
      filters,
    });
    if (result) {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_LIST_SUCCESS,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_LIST_FAILURE,
        data: null,
      };
    }

    return returnData;
  } catch (error) {
    throw error;
  }
};

const findSingleAccess = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const accessId = +req.params.id;
    if (!Number.isFinite(accessId) || accessId <= 0) {
      return {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_NOT_FOUND,
        data: null,
      };
    }
    const accessModule = await roleMenuModel.findOne({
      where: { id: accessId, isDeleted: false },
      attributes: { exclude: ["updatedAt", "createdAt"] },
      include: [
        {
          model: roleMenuActionModel,
          attributes: { exclude: ["updatedAt", "createdAt"] },
        },
      ],
      //   raw: true,
    });
    if (accessModule && accessModule.id) {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_VIEW_SUCCESS,
        data: accessModule,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_NOT_FOUND,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const findRoleMenuActions = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };

    const roleMenuActionId = +req.params.id;
    const roleMenuAction = await roleMenuModel.findOne({
      where: { id: roleMenuActionId, isDeleted: false },
      attributes: ["id", "title"],
      include: [
        {
          model: roleMenuActionModel,
          attributes: ["title"],
          include: [
            {
              model: roleActionModel,
              attributes: ["roleMenuActionId", "requiredApproval"],
              include: [
                {
                  model: roleModel,
                  attributes: ["id", "title"],
                },
              ],
              raw: true,
            },
          ],
        },
      ],
      // raw: true,
    });
    if (roleMenuAction && roleMenuAction.id) {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_VIEW_SUCCESS,
        data: roleMenuAction,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_LIST_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const findRoleMenuAllowableActions = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const roleMenuActionId = +req.params.id;

    const roleMenuActions = await roleMenuActionModel.findAll({
      where: { roleMenuId: roleMenuActionId, isDeleted: false },
    });
    if (roleMenuActions.length > 0) {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ROLE_MENU_ACTION_VIEW_SUCCESS,
        data: roleMenuActions,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ROLE_MENU_NOT_FOUND,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const findAllRoleActions = async () => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const roleActions = await roleActionModel.findAndCountAll({
      attributes: ["id", "roleId", "roleMenuActionId", "requiredApproval"],
    });

    if (roleActions) {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_VIEW_SUCCESS,
        data: roleActions,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_LIST_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const findAllRoleMenuActionModel = async (req) => {
  try {
    let { limit, page } = req.query;
    const filters = {};
    const include = [];

    const result = await paginate(roleMenuActionModel, {
      limit,
      page,
      filters,
      include,
      order: [["id", "ASC"]],
    });

    if (result) {
      return {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_LIST_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.ACCESS_MODULE.ACCESS_MODULE_LIST_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllAccessModule,
  findSingleAccess,
  findRoleMenuActions,
  findRoleMenuAllowableActions,
  findAllRoleActions,
  findAllRoleMenuActionModel,
};
