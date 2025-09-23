const revenueService = require("../services/revenue-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const list = async (req, res, next) => {
  try {
    const result = await revenueService.list(req);

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

const totalRevenue = async (req, res, next) => {
  try {
    const result = await revenueService.totalRevenue(req);

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
const groupedList = async (req, res, next) => {
  try {
    const result = await revenueService.groupedList(req);

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
    const result = await revenueService.getRevenueById(req);

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
    const result = await revenueService.createRevenue(req);

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
const update = async (req, res, next) => {
  try {
    const result = await revenueService.updateRevenue(req);

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
const deleteRevenue = async (req, res, next) => {
  try {
    const result = await revenueService.deleteRevenue(req);

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
  list,
  create,
  update,
  deleteRevenue,
  getById,
  groupedList,
  totalRevenue,
};
