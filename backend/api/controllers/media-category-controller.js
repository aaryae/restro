const mediaCategoryService = require("../services/media-category-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const createMediaCategory = async (req, res, next) => {
  try {
    const result = await mediaCategoryService.create(req);
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
    const result = await mediaCategoryService.getById(req);
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
    const result = await mediaCategoryService.findAll(req);
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
    const result = await mediaCategoryService.update(req);
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

const deleteMediaCategory = async (req, res, next) => {
  try {
    const result = await mediaCategoryService.deleteMediaCategory(req);
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
  createMediaCategory,
  getById,
  list,
  update,
  deleteMediaCategory,
};
