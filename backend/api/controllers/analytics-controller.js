const analyticsService = require("../services/analytics-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const result = await analyticsService.viewWeeklyAnalytics(req);
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
  getWeeklyAnalytics,
};
