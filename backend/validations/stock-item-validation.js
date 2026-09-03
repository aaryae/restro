const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const postValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(150).required(),
    measuringUnitId: Joi.number().integer().positive().required(),
    stockGroupId: Joi.number().integer().positive().optional().allow(null),
    supplierId: Joi.number().integer().positive().optional().allow(null),
    defaultPrice: Joi.number().min(0).optional().default(0),
    openingQuantity: Joi.number().min(0).optional().default(0),
    openingRate: Joi.number().min(0).optional(),
    lowStockThreshold: Joi.number().min(0).optional().allow(null),
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

const putValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(150).optional(),
    measuringUnitId: Joi.number().integer().positive().optional(),
    stockGroupId: Joi.number().integer().positive().optional().allow(null),
    supplierId: Joi.number().integer().positive().optional().allow(null),
    defaultPrice: Joi.number().min(0).optional(),
    lowStockThreshold: Joi.number().min(0).optional().allow(null),
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

const adjustValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    type: Joi.string()
      .valid("purchase", "adjustment_in", "adjustment_out", "waste")
      .required(),
    quantity: Joi.number().positive().required(),
    rate: Joi.number().min(0).optional(),
    note: Joi.string().max(500).optional().allow(null, ""),
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

module.exports = { postValidation, putValidation, adjustValidation };
