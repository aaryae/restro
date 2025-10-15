const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");
const isEmpty = require("../helpers/is-empty-helper");

const addonPostValidation = async (req, res, next) => {
  const joiModel = joi.object({
    name: joi.string().trim().min(1).required().messages({
      "string.base": "Name must be a string",
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
    }),
    price: joi.number().precision(2).min(0).required().messages({
      "number.base": "Price must be a number",
      "number.precision": "Price can have up to 2 decimal places",
      "number.min": "Price must be a non-negative number",
      "any.required": "Price is required",
    }),
    imageUrl: joi.string().required().messages({
      "any.required": "Image URL is required",
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

const addonPutValidation = async (req, res, next) => {
  const joiModel = joi
    .object({
      name: joi.string().trim().min(1).messages({
        "string.base": "Name must be a string",
        "string.empty": "Name cannot be empty",
      }),
      price: joi.number().precision(2).min(0).messages({
        "number.base": "Price must be a number",
        "number.precision": "Price can have up to 2 decimal places",
        "number.min": "Price must be a non-negative number",
      }),
      imageUrl: joi.string().messages({
        "any.required": "Image URL is required",
      }),
    })
    .min(1); // At least one field is required for update

  const errors = await validateRequestBody(req, res, joiModel);
  if (!isEmpty(errors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      errors,
      messageConstant.EN.VALIDATION_ERROR,
    );
  }
  return next();
};

module.exports = {
  addonPostValidation,
  addonPutValidation,
};
