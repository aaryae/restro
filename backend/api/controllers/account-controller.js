const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const accountService = require("../services/account-service");
const list = async (req, res, next) => {
  try {
    const result = await revenueService.list(req);

    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const create = async (req, res, next) => {
  try {
    const result = await accountService.createAccount(req);

    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const update = async (req, res, next) => {
  try {
    const result = await revenueService.updateRevenue(req);

    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
const deleteRevenue = async (req, res, next) => {
  try {
    const result = await revenueService.deleteRevenue(req);

    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
      result.token,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = {
  create,
};
