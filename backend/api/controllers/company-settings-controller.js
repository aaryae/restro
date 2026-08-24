const settingService = require("../services/company-settings-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const getOne = async (req, res, next) => {
  try {
    const result = await settingService.getOne(req);
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
    const result = await settingService.getById(req);
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

const updateById = async (req, res, next) => {
  try {
    const result = await settingService.updateById(req);
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

// const list = async (req, res, next) => {
//   try {
//     const result = await settingService.findAll(req);
//     return responseHelper.sendResponse(
//       res,
//       result.status,
//       result.success,
//       result.data,
//       result.errors,
//       result.message,
//       result.token,
//     );
//   } catch (err) {
//     logger.error(err);
//     next(err);
//   }
// };

const create = async (req, res, next) => {
  try {
    const result = await settingService.create(req);
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
  getOne,
  updateById,
  create,
};
