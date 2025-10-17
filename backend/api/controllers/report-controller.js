const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const reportsService = require("../services/report-service");

module.exports.getDailySummary = async (req, res, next) => {
  try {
    const result = await reportsService.getDailySummary(req);

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
module.exports.getDailyRevenueReport = async (req, res, next) => {
  try {
    const result = await reportsService.getDailyRevenueReport(req);

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
module.exports.getDailyTableSessions = async (req, res, next) => {
  try {
    const result = await reportsService.getDailyTableSessions(req);

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
