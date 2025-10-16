const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const {
  getAccountsRevenue,
  getAccountsPurchase,
  getAccountsExpense,
} = require("../services/report-service");

module.exports.getDailySummary = async (req, res, next) => {
  try {
    const accountsRevenue = await getAccountsRevenue(req, res);
    const accountsPurchase = await getAccountsPurchase(req, res);
    const accountsExpense = await getAccountsExpense(req, res);
    const result = {
      data: {
        accountsRevenue,
        accountsPurchase,
        accountsExpense,
      },
      message: "Daily summary retrived successfully.",
      status: 200,
      success: true,
    };

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
