const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const postValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    symbol: Joi.string().trim().min(1).max(20).required(),
    description: Joi.string().trim().max(500).optional().allow(null, ""),
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
    name: Joi.string().trim().min(1).max(100).optional(),
    symbol: Joi.string().trim().min(1).max(20).optional(),
    description: Joi.string().trim().max(500).optional().allow(null, ""),
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

module.exports = { postValidation, putValidation };
