const orderService = require("../services/order-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req);
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

const updateOrderItems = async (req, res, next) => {
  try {
    const result = await orderService.updateOrderItems(req);
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

const getTableActiveOrders = async (req, res, next) => {
  try {
    const result = await orderService.getTableActiveOrders(req);
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

const getOrderById = async (req, res, next) => {
  try {
    console.log("++++++++++++++++++++++==");
    const result = await orderService.getOrderById(req);
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

const listOrders = async (req, res, next) => {
  try {
    const result = await orderService.listOrders(req);
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
const listOrderItems = async (req, res, next) => {
  try {
    const result = await orderService.getOrderItems(req);
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

const updateOrderStatus = async (req, res, next) => {
  try {
    const result = await orderService.updateOrderStatus(req);
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

const bulkServeOrderItems = async (req, res, next) => {
  try {
    const result = await orderService.bulkServeOrderItems(req);
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

const updateOrderItemsStatus = async (req, res, next) => {
  try {
    const result = await orderService.updateOrderItemsStatus(req);
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

const checkoutOrder = async (req, res, next) => {
  try {
    const result = await orderService.checkoutOrder(req);
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
  createOrder,
  updateOrderItems,
  getTableActiveOrders,
  getOrderById,
  listOrders,
  listOrderItems,
  updateOrderStatus,
  bulkServeOrderItems,
  updateOrderItemsStatus,
  checkoutOrder,
};
