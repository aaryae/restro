const fs = require("fs");
const stockItemService = require("../services/stock-item-service");
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

const isTruthyFlag = (value) =>
  value === true || value === "true" || value === "1" || value === 1;

const importFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return responseHelper.sendResponse(
        res,
        400,
        false,
        null,
        { file: "No file uploaded" },
        "Please upload a file",
      );
    }

    const result = await stockItemService.importFromExcel(
      req.file,
      {
        dryRun: isTruthyFlag(req.body?.dryRun),
        createMissingGroups:
          req.body?.createMissingGroups === undefined
            ? true
            : isTruthyFlag(req.body.createMissingGroups),
      },
      req,
    );

    return responseHelper.sendResponse(
      res,
      result.status,
      result.success,
      result.data,
      null,
      result.message,
    );
  } catch (err) {
    logger.error("Error importing stock items:", err);
    next(err);
  } finally {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  }
};

module.exports = {
  create: wrap((req) => stockItemService.create(req)),
  list: wrap((req) => stockItemService.list(req)),
  getById: wrap((req) => stockItemService.getById(req)),
  update: wrap((req) => stockItemService.update(req)),
  adjust: wrap((req) => stockItemService.adjust(req)),
  summary: wrap(() => stockItemService.summary()),
  deleteById: wrap((req) => stockItemService.deleteById(req)),
  importFromExcel,
};
