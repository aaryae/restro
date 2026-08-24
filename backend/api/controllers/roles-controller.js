const rolesService = require("../services/roles-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const createRoles = async (req, res, next) => {
  try {
    const createRole = await rolesService.createRole(req, req.body);
    return responseHelper.sendResponse(
      res,
      createRole.status,
      createRole.success,
      createRole.data,
      createRole.errors,
      createRole.message,
      createRole.token,
    );
  } catch (err) {
    logger.error(err);

    next(err);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const listRoles = await rolesService.findAllRoles(req);
    return responseHelper.paginationSendResponse(
      res,
      listRoles.status,
      listRoles.success,
      listRoles.data,
      listRoles.message,
      listRoles.page,
      listRoles.size,
      listRoles.totalData,
      listRoles.sort,
    );
  } catch (err) {
    logger.error(err);

    next(err);
  }
};

const getRoleSingle = async (req, res, next) => {
  try {
    const viewSingleRole = await rolesService.findSingleRole(req);
    return responseHelper.sendResponse(
      res,
      viewSingleRole.status,
      viewSingleRole.success,
      viewSingleRole.data,
      viewSingleRole.errors,
      viewSingleRole.message,
      viewSingleRole.token,
    );
  } catch (err) {
    logger.error(err);

    next(err);
  }
};

const editRoleSingle = async (req, res, next) => {
  try {
    const viewSingleRole = await rolesService.editSingleRole(req);
    return responseHelper.sendResponse(
      res,
      viewSingleRole.status,
      viewSingleRole.success,
      viewSingleRole.data,
      viewSingleRole.errors,
      viewSingleRole.message,
      viewSingleRole.token,
    );
  } catch (err) {
    logger.error(err);

    next(err);
  }
};

const deleteRoleSingle = async (req, res, next) => {
  try {
    const viewSingleRole = await rolesService.deleteSingleRole(req);
    return responseHelper.sendResponse(
      res,
      viewSingleRole.status,
      viewSingleRole.success,
      viewSingleRole.data,
      viewSingleRole.errors,
      viewSingleRole.message,
      viewSingleRole.token,
    );
  } catch (err) {
    logger.error(err);

    next(err);
  }
};

module.exports = {
  createRoles,
  getRoles,
  getRoleSingle,
  editRoleSingle,
  deleteRoleSingle,
};
