const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const createTableValidation = async (req, res, next) => {
  let joiModel = joi.object({
    floorId: joi.number().integer().required(),
    tableNo: joi.string().required(),
    type: joi.string().valid("indoor", "outdoor", "vip", "regular").required(),
    capacity: joi.number().integer().min(1).required(),
    status: joi
      .string()
      .valid("available", "occupied", "maintenance")
      .optional(),
    sessionId: joi.string().uuid().allow(null, "").optional(),
    sessionStartTime: joi.date().allow(null).optional(),
    name: joi.string().allow(null, "").optional(),
  });
  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }
  return next();
};

const updateTableValidation = async (req, res, next) => {
  let joiModel = joi.object({
    floorId: joi.number().integer().optional(),
    tableNo: joi.string().optional(),
    type: joi.string().valid("indoor", "outdoor", "vip", "regular").optional(),
    capacity: joi.number().integer().min(1).optional(),
    status: joi
      .string()
      .valid("available", "occupied", "maintenance")
      .optional(),
    sessionId: joi.string().uuid().allow(null, "").optional(),
    sessionStartTime: joi.date().allow(null).optional(),
    name: joi.string().allow(null, "").optional(),
  });
  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }
  return next();
};

module.exports = {
  createTableValidation,
  updateTableValidation,
};
