const socialService = require("../services/social-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const createSocial = async (req, res, next) => {
  try {
    const result = await socialService.createSocial(req);
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
    const result = await socialService.getSocialById(req);
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
    const result = await socialService.findAll(req);
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
    const result = await socialService.updateSocialById(req);
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

const deleteSocial = async (req, res, next) => {
  try {
    const result = await socialService.deleteSocialById(req);
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
  createSocial,
  getById,
  list,
  update,
  deleteSocial,
};
