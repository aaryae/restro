const { actionRequestModel, userModel } = require("../../models");
const generalConstant = require("../../constants/general-constant");

const paginate = require("../../utils/paginate");
const { executeApiCall, reject } = require("../../helpers/api-call-helper");
const { Op } = require("sequelize");

const action = async (req) => {
  try {
    const actionRequest = await actionRequestModel.findOne({
      where: { id: +req.params.id },
    });
    if (!actionRequest) {
      return {
        ...generalConstant.EN.ACTION_REQUEST.NOT_FOUND,
        data: null,
      };
    }
    // if got something like 'true' so i have check it with == true
    if (req.body.action == true) {
      const result = await executeApiCall(
        actionRequest.id,
        req.headers.authorization,
      );

      if (result?.success) {
        return {
          ...generalConstant.EN.ACTION_REQUEST.APPROVE_SUCCESS,
          data: result.data,
        };
      } else {
        return {
          status: result.status,
          success: result.success,
          message: result.msg,
        };
      }
    }

    const rejects = await reject(actionRequest);
    return rejects;
  } catch (error) {
    throw error;
  }
};

const getAll = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    let { limit, page, status } = req.query;
    let filters = {};
    const include = [
      {
        model: userModel,
        as: "user",
        attributes: ["username"],
      },
    ];

    if (status) {
      filters.status = String(status);
    }
    const result = await paginate(actionRequestModel, {
      limit,
      page,
      filters,
      include,
    });

    if (result) {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_LIST_SUCCESS,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_LIST_FAILURE,
        data: null,
      };
    }

    return returnData;
  } catch (error) {
    throw error;
  }
};

const getAllRelatedRequest = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    let { limit, page, status } = req.query;
    const userId = req.user.id;
    let filters = {};

    if (userId) {
      filters.userId = userId;
    }
    const include = [
      {
        model: userModel,
        as: "user",
        attributes: ["username"],
      },
    ];

    if (status) {
      filters.status = String(status);
    }
    const result = await paginate(actionRequestModel, {
      limit,
      page,
      filters,
      include,
    });

    if (result) {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_LIST_SUCCESS,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_LIST_FAILURE,
        data: null,
      };
    }

    return returnData;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  action,
  getAll,
  getAllRelatedRequest,
};
