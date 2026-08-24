const supplierService = require("../services/supplier-service");
const logger = require("../../configs/logger");
const responseHelper = require("../../helpers/response-helper");
const create = async (req, res, next) => {
  try {
    const result = await supplierService.create(req);

    return responseHelper.sendResponse(
      res,
      result.status || 200,
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

const getList = async (req, res, next) => {
  try {
    const result = await supplierService.getList(req);
    return responseHelper.sendResponse(
      res,
      result.status || 200,
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
    // const id = req.params.id;
    const result = await supplierService.getById(req);

    return responseHelper.sendResponse(
      res,
      result.status || 200,
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
    const id = req.params.id;
    const data = req.body;

    const result = await supplierService.update(id, data);
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
    const id = req.params.id;
    const result = await supplierService.deleteById(id, req);

    return responseHelper.sendResponse(
      res,
      result.status || 200,
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
  getById,
  getList,
  deleteById,
  update,
};
