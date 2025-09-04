const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const transferService = require("../services/transfer-service");
const list = async (req, res, next) => {
  try {
    const result = await accountService.list(req);

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
    const result = await transferService.createTransfer(req);

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
  list,
  create,
};
