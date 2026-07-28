const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");



const createValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().optional().allow("", null).label("email"),
    password: joi.string().optional().min(1).label("password"),
    firstName: joi.string().optional().allow("", null).label("firstName"),
    lastName: joi.string().optional().allow("", null).label("lastName"),
    mobileNo: joi
      .string()
      .required()
      .pattern(/^\d+$/)
      .min(10)
      .max(15)
      .messages({
        "any.required": "Mobile number is required",
        "string.empty": "Mobile number is required",
        "string.pattern.base": "Mobile number must contain only digits",
        "string.min": "Mobile number must be at least 10 digits",
        "string.max": "Mobile number cannot exceed 15 digits",
      })
      .label("mobileNo"),
    createdAt: joi.any().optional(),
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
const updateValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().optional().label("email"),
    password: joi.string().optional().min(1).label("password"),
    firstName: joi.string().optional().label("firstName"),
    lastName: joi.string().optional().label("lastName"),
    mobileNo: joi
      .string()
      .optional()
      .pattern(/^\d+$/)
      .min(10)
      .max(15)
      .messages({
        "string.pattern.base": "Mobile number must contain only digits",
        "string.min": "Mobile number must be at least 10 digits",
        "string.max": "Mobile number cannot exceed 15 digits",
      })
      .label("mobileNo"),
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
  createValidation,
  updateValidation
};
