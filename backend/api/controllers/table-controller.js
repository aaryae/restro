const tableService = require("../services/table-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const create = async (req, res, next) => {
  try {
    const result = await tableService.create(req);
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

const list = async (req, res, next) => {
  try {
    const result = await tableService.list(req);
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

const getById = async (req, res, next) => {
  try {
    const result = await tableService.getById(req);
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

const updateTableStatus = async (req, res, next) => {
  try {
    const result = await tableService.updateTableStatus(req);
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

const deleteById = async (req, res, next) => {
  try {
    const result = await tableService.deleteById(req);
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

const moveOrders = async (req, res, next) => {
  try {
    const result = await tableService.moveOrders(req);
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
  getById,
  updateTableStatus,
  deleteById,
  moveOrders,
};
