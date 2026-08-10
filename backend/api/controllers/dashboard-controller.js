const dashboardService = require("../services/dashboard-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const overview = async (req, res, next) => {
  try {
    const result = await dashboardService.overview(req);
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

const dailySales = async (req, res, next) => {
  try {
    const result = await dashboardService.dailySales(req);
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
  overview,
  dailySales,
};
