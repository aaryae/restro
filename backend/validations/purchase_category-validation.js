const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const categoryPostValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      "string.base": "Name must be a string",
      "string.min": "Name must be at least 1 character",
      "string.max": "Name must not exceed 100 characters",
      "any.required": "Name is required",
    }),
    description: Joi.string().max(255).optional().allow(null).messages({
      "string.base": "Description must be a string",
      "string.max": "Description must not exceed 255 characters",
    }),
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

const categoryPutValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      "string.base": "Name must be a string",
      "string.min": "Name must be at least 1 character",
      "string.max": "Name must not exceed 100 characters",
    }),
    description: Joi.string().max(255).optional().allow(null).messages({
      "string.base": "Description must be a string",
      "string.max": "Description must not exceed 255 characters",
    }),
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

const categoryDeleteValidation = async (req, res, next) => {
  const joiModel = Joi.object({}); // No body required
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
  categoryPostValidation,
  categoryPutValidation,
  categoryDeleteValidation,
};
