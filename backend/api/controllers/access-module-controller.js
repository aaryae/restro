const accessModulesServices = require("../services/access-module-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const getAccessModules = async (req, res, next) => {
  try {
    const listAccess = await accessModulesServices.getAllAccessModule(req);
    return responseHelper.sendResponse(
      res,
      listAccess.status,
      listAccess.success,
      listAccess.data,
      listAccess.errors,
      listAccess.message,
      listAccess.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getAccessModule = async (req, res, next) => {
  try {
    const viewSingleAccess = await accessModulesServices.findSingleAccess(req);
    return responseHelper.sendResponse(
      res,
      viewSingleAccess.status,
      viewSingleAccess.success,
      viewSingleAccess.data,
      viewSingleAccess.errors,
      viewSingleAccess.message,
      viewSingleAccess.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getRoleMenuActions = async (req, res, next) => {
  try {
    const viewRoleMenuActions =
      await accessModulesServices.findRoleMenuActions(req);
    return responseHelper.sendResponse(
      res,
      viewRoleMenuActions.status,
      viewRoleMenuActions.success,
      viewRoleMenuActions.data,
      viewRoleMenuActions.errors,
      viewRoleMenuActions.message,
      viewRoleMenuActions.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getRoleAllowableActions = async (req, res, next) => {
  try {
    const viewRoleAllowableActions =
      await accessModulesServices.findRoleMenuAllowableActions(req);
    return responseHelper.sendResponse(
      res,
      viewRoleAllowableActions.status,
      viewRoleAllowableActions.success,
      viewRoleAllowableActions.data,
      viewRoleAllowableActions.errors,
      viewRoleAllowableActions.message,
      viewRoleAllowableActions.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getRoleActions = async (req, res, next) => {
  try {
    const viewRoleActions = await accessModulesServices.findAllRoleActions(req);
    return responseHelper.sendResponse(
      res,
      viewRoleActions.status,
      viewRoleActions.success,
      viewRoleActions.data,
      viewRoleActions.errors,
      viewRoleActions.message,
      viewRoleActions.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
const getAllRoleMenuAction = async (req, res, next) => {
  try {
    const viewRoleActions =
      await accessModulesServices.findAllRoleMenuActionModel(req);
    return responseHelper.sendResponse(
      res,
      viewRoleActions.status,
      viewRoleActions.success,
      viewRoleActions.data,
      viewRoleActions.errors,
      viewRoleActions.message,
      viewRoleActions.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

module.exports = {
  getAccessModules,
  getAccessModule,
  getRoleMenuActions,
  getRoleAllowableActions,
  getRoleActions,
  getAllRoleMenuAction,
};
