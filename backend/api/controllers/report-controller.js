const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const {
  getAccountsRevenue,
  getAccountsPurchase,
} = require("../services/report-service");

module.exports.getDailySummary = async (req, res, next) => {
  try {
    const accountsRevenue = await getAccountsRevenue(req, res);
    const accountsPurchase = await getAccountsPurchase(req, res);
    console.log(accountsPurchase, "****\n****\n***");
    const result = { data: "hello" };

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
