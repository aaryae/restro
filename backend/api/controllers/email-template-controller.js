const emailTemplateService = require("../services/email-template-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const create = async (req, res, next) => {
  try {
    const result = await emailTemplateService.create(req);
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
    const result = await emailTemplateService.getById(req);
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
    const result = await emailTemplateService.findAllTemplate(req);
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
    const result = await emailTemplateService.update(req);
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

const deleteTemplate = async (req, res, next) => {
  try {
    const result = await emailTemplateService.deleteTemplate(req);
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
  getById,
  list,
  create,
  deleteTemplate,
  update,
};
