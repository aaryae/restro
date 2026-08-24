const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");
const accountService = require("../services/account-service");
const list = async (req, res, next) => {
  try {
    const result = await accountService.list(req);

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
    const result = await accountService.createAccount(req);

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
const getAccountByID = async (req, res, next) => {
  try {
    const result = await accountService.getAccountByID(req);
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

const updateAccount = async (req, res, next) => {
  try {
    const result = await accountService.updateAccount(req);
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

const deleteAccount = async (req, res, next) => {
  try {
    const result = await accountService.deleteAccount(req);
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
const changeStatus = async (req, res, next) => {
  try {
    const result = await accountService.changeStatus(req);

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
const changeDefaultAccount = async (req, res, next) => {
  try {
    const result = await accountService.changeDefaultAccount(req);

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

const totalAndBalances = async (req, res, next) => {
  try {
    const result = await accountService.totalAndBalances(req);

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
  getAccountByID,
  updateAccount,
  changeStatus,
  changeDefaultAccount,
  totalAndBalances,
  deleteAccount,
};
