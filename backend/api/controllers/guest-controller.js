"use strict";

const guestService = require("../services/guest-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const getMenu = async (req, res, next) => {
  try {
    const result = await guestService.getMenu(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors || null,
      result.message,
      null,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getBill = async (req, res, next) => {
  try {
    const result = await guestService.getBill(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors || null,
      result.message,
      null,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const callBill = async (req, res, next) => {
  try {
    const result = await guestService.callBill(req);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      result.errors || null,
      result.message,
      null,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = {
  getMenu,
  getBill,
  callBill,
};
