const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const transactionService = require("../services/transaction-service");

const list = async (req, res, next) => {
  try {
    const result = await transactionService.list(req);

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

const totalTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.total(req);

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
    const result = await transactionService.create(req);

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

const getTransactionByID = async (req, res, next) => {
  try {
    const result = await transactionService.getById(req);

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
  create,
  list,
  getTransactionByID,
  totalTransaction,
};
