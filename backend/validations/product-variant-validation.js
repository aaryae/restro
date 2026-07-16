const joi = require("joi");

const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");

const productVariantPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    productId: joi.number().integer().positive().required(),
    name: joi.string().trim().min(1).required(),
    description: joi.string().allow(null, "").optional(),
    quantity: joi.number().integer().min(0).required(),
    price: joi.number().precision(2).min(0).required(),
    mediaArr: joi.array().items(joi.string()).optional(),
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

const productVariantPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    productId: joi.number().integer().positive().optional(),
    name: joi.string().trim().min(1).optional(),
    description: joi.string().allow(null, "").optional(),
    quantity: joi.number().integer().min(0).optional(),
    price: joi.number().precision(2).min(0).optional(),
    mediaArr: joi.array().items(joi.string()).optional(),
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
  productVariantPostValidation,
  productVariantPutValidation,
};
