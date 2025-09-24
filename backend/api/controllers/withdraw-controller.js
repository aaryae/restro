const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const withdrawService = require("../services/withdraw-service");

const list = async (req, res, next) => {
  try {
    const result = await withdrawService.list(req);

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
    const result = await withdrawService.create(req);

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

const getWithdrawByID = async (req, res, next) => {
  try {
    const result = await withdrawService.getById(req);

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

const updateWithdraw = async (req, res, next) => {
  try {
    const result = await withdrawService.update(req);

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
  list,
  getWithdrawByID,
  updateWithdraw,
};
