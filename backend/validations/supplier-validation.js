const joi = require("joi");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const httpStatus = require("http-status");

const supplierPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().trim().min(2).required().messages({
      "string.base": "Name must be a string",
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
    }),
    address: joi.string().trim().min(2).required().messages({
      "string.base": "Address must be a string",
      "string.empty": "Address cannot be empty",
      "any.required": "Address is required",
    }),
    pan_number: joi.number().integer().required().messages({
      "number.base": "PAN number must be a number",
      "number.integer": "PAN number must be an integer",
      "any.required": "PAN number is required",
    }),
    point_of_contact: joi.number().integer().required().messages({
      "number.base": "Point of number must be a number",
      "number.integer": "Point of number must be an integer",
      "any.required": "Point of number is required",
    }),
    contact_number: joi.number().integer().required().messages({
      "number.base": "Contact number must be a number",
      "number.integer": "Contact number must be an integer",
      "any.required": "Contact number is required",
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

const supplierPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().trim().min(2).optional(),
    address: joi.string().trim().min(2).optional(),
    pan_number: joi.number().integer().optional(),
    point_of_contact: joi.number().integer().optional(),
    contact_number: joi.number().integer().optional(),
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
  supplierPostValidation,
  supplierPutValidation,
};
