const revenueService = require("../services/revenue-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

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

module.exports = {
  list,
};
