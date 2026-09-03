const measuringUnitService = require("../services/measuring-unit-service");
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
  create: wrap((req) => measuringUnitService.create(req)),
  list: wrap((req) => measuringUnitService.list(req)),
  getById: wrap((req) => measuringUnitService.getById(req)),
  update: wrap((req) => measuringUnitService.update(req)),
  deleteById: wrap((req) => measuringUnitService.deleteById(req)),
};
