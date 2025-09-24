const accountPermissionService = require("../services/account-permission-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const list = async (req, res, next) => {
  try {
    const result = await accountPermissionService.list(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await accountPermissionService.getById(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await accountPermissionService.create(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await accountPermissionService.update(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await accountPermissionService.remove(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

const getByUserId = async (req, res, next) => {
  try {
    const result = await accountPermissionService.getByUserId(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (error) {
    logger.error(error);
    next(error);
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
