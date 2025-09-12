const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const expenseCategoryPostValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      "string.base": "Name must be a string",
      "string.min": "Name must be at least 1 character",
      "string.max": "Name must not exceed 100 characters",
      "any.required": "Name is required",
    }),
    description: Joi.string().optional().allow(null),
    isActive: Joi.boolean().optional().default(true),
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

const expenseCategoryPutValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    description: Joi.string().optional().allow(null),
    isActive: Joi.boolean().optional(),
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
  expenseCategoryPostValidation,
  expenseCategoryPutValidation,
};
