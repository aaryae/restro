const stockGroupService = require("../services/stock-group-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const wrap =
  (fn) =>
  async (req, res, next) => {
    try {
      const result = await fn(req);
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
  create: wrap((req) => stockGroupService.create(req)),
  list: wrap((req) => stockGroupService.list(req)),
  getById: wrap((req) => stockGroupService.getById(req)),
  update: wrap((req) => stockGroupService.update(req)),
  deleteById: wrap((req) => stockGroupService.deleteById(req)),
};
