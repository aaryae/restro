const paymentIntegrationService = require("../services/payment-integration-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

function send(res, result) {
  return responseHelper.sendResponse(
    res,
    result.status,
    result.success,
    result.data !== undefined ? result.data : null,
    result.errors !== undefined ? result.errors : null,
    result.message !== undefined ? result.message : null,
    null,
  );
}

const list = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.list(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const activeAccounts = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.activeAccountIds(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.getById(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.create(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.update(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const setActive = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.setActive(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    return send(res, await paymentIntegrationService.remove(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = {
  list,
  activeAccounts,
  getById,
  create,
  update,
  setActive,
  remove,
};
