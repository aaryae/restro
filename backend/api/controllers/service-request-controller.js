"use strict";

const serviceRequestService = require("../services/service-request-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const listOpen = async (req, res, next) => {
  try {
    const result = await serviceRequestService.listOpen(req);
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

const markHandled = async (req, res, next) => {
  try {
    const result = await serviceRequestService.markHandled(req);
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
  listOpen,
  markHandled,
};
