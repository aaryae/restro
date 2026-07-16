const productService = require("../services/product-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const create = async (req, res, next) => {
  try {
    const result = await productService.create(req);

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
    const result = await productService.list(req);

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

const topSelling = async (req, res, next) => {
  try {
    const result = await productService.topSelling(req);

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
    const result = await productService.getById(req);
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
    const result = await productService.updateById(req);
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
const updateByOrder = async (req, res, next) => {
  try {
    const result = await productService.updateByOrder(req);
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

const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteById(req);
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

const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return responseHelper.sendResponse(
        res,
        400,
        false,
        null,
        { file: 'No file uploaded' },
        'Please upload a file',
      );
    }

    const result = await productService.importFromExcel(req.file);
    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      null,
      result.message,
    );
  } catch (err) {
    logger.error('Error importing products:', err);
    next(err);
  }
}

module.exports = {
  create,
  getById,
  list,
  topSelling,
  deleteProduct,
  importFromExcel,
  update,
  updateByOrder,
};
