const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const reportsService = require("../services/report-service");

const send = async (res, next, fn, req) => {
  try {
    const result = await fn(req);
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

module.exports.getDailySummary = (req, res, next) =>
  send(res, next, reportsService.getDailySummary, req);

module.exports.getDailyRevenueReport = (req, res, next) =>
  send(res, next, reportsService.getDailyRevenueReport, req);

module.exports.getDailyTableSessions = (req, res, next) =>
  send(res, next, reportsService.getDailyTableSessions, req);

module.exports.getCounterCashSummary = (req, res, next) =>
  send(res, next, reportsService.getCounterCashSummary, req);

module.exports.getBusinessOverview = (req, res, next) =>
  send(res, next, reportsService.getBusinessOverview, req);

module.exports.getMenuPerformance = (req, res, next) =>
  send(res, next, reportsService.getMenuPerformance, req);

module.exports.getPurchaseVsRevenue = (req, res, next) =>
  send(res, next, reportsService.getPurchaseVsRevenue, req);
