const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const ledgerService = require("../services/ledger-service");

module.exports.getLedgerList = async (req, res, next) => {
  try {
    const result = await ledgerService.list(req);

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
