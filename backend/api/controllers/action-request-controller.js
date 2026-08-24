const actionRequestService = require("../services/action-request-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const actionRequest = async (req, res, next) => {
  try {
    const updateAction = await actionRequestService.action(req);
    return responseHelper.sendResponse(
      res,
      updateAction.status,
      updateAction.success,
      updateAction.data,
      updateAction.errors,
      updateAction.message,
      updateAction.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const getAllAction = await actionRequestService.getAll(req);
    return responseHelper.sendResponse(
      res,
      getAllAction.status,
      getAllAction.success,
      getAllAction.data,
      getAllAction.errors,
      getAllAction.message,
      getAllAction.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getRelatedRequest = async (req, res, next) => {
  try {
    const getAllAction = await actionRequestService.getAllRelatedRequest(req);
    return responseHelper.sendResponse(
      res,
      getAllAction.status,
      getAllAction.success,
      getAllAction.data,
      getAllAction.errors,
      getAllAction.message,
      getAllAction.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
module.exports = {
  actionRequest,
  getAll,
  getRelatedRequest,
};
