const notificationService = require("../services/notification-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

// const createNotification = async (req, res, next) => {
//   try {
//     const result = await notificationService.create(req);
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

const getById = async (req, res, next) => {
  try {
    const result = await notificationService.getById(req);
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
    const result = await notificationService.list(req);
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

const updateReadStatus = async (req, res, next) => {
  try {
    const result = await notificationService.updateReadStatus(req);
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
// const deleteNotification = async (req, res, next) => {
//   try {
//     const result = await notificationService.deleteById(req);
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

module.exports = {
  getById,
  list,
  // createNotification,
  updateReadStatus,
  // deleteNotification,
};
