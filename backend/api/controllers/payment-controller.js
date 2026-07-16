const paymentIntentService = require("../services/payment-intent-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const initiateQr = async (req, res, next) => {
  try {
    const result = await paymentIntentService.initiateQrPayment(req);
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

const getStatus = async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    const result = await paymentIntentService.getIntentStatus(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const result = await paymentIntentService.cancelIntent(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors,
      result.message,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = { initiateQr, getStatus, cancel };
