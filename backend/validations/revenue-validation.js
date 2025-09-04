const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const revenuePostValidation = async (req, res, next) => {
  const joiModel = joi.object({
    amount: joi.number().precision(2).min(0.01).required().messages({
      "number.base": "Amount must be a number",
      "number.precision": "Amount must have up to 2 decimal places",
      "number.min": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    paymentMethod: joi
      .string()
      .valid("cash", "card", "online")
      .default("cash")
      .optional()
      .messages({
        "string.base": "Payment method must be a string",
        "any.only": "Payment method must be one of 'cash', 'card', or 'online'",
      }),
    cash_or_credit: joi
      .string()
      .valid("cash", "credit")
      .default("cash")
      .optional()
      .messages({
        "string.base": "Cash or credit must be a string",
        "any.only": "Cash or credit must be one of 'cash' or 'credit'",
      }),
    customerId: joi
      .number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        "number.base": "Customer ID must be a number",
        "number.integer": "Customer ID must be an integer",
        "number.positive": "Customer ID must be a positive number",
      }),
    userId: joi.number().integer().positive().required().messages({
      "number.base": "User ID must be a number",
      "number.integer": "User ID must be an integer",
      "number.positive": "User ID must be a positive number",
      "any.required": "User ID is required",
    }),
    accountId: joi.number().integer().positive().required().messages({
      "number.base": "Account ID must be a number",
      "number.integer": "Account ID must be an integer",
      "number.positive": "Account ID must be a positive number",
      "any.required": "Account ID is required",
    }),
    remarks: joi.string().trim().allow("").optional().messages({
      "string.base": "Remarks must be a string",
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

const revenuePutValidation = async (req, res, next) => {
  const joiModel = joi.object({
    amount: joi.number().precision(2).min(0.01).optional().messages({
      "number.base": "Amount must be a number",
      "number.precision": "Amount must have up to 2 decimal places",
      "number.min": "Amount must be greater than 0",
    }),
    paymentMethod: joi
      .string()
      .valid("cash", "card", "online")
      .optional()
      .messages({
        "string.base": "Payment method must be a string",
        "any.only": "Payment method must be one of 'cash', 'card', or 'online'",
      }),
    cash_or_credit: joi.string().valid("cash", "credit").optional().messages({
      "string.base": "Cash or credit must be a string",
      "any.only": "Cash or credit must be one of 'cash' or 'credit'",
    }),
    customerId: joi
      .number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        "number.base": "Customer ID must be a number",
        "number.integer": "Customer ID must be an integer",
        "number.positive": "Customer ID must be a positive number",
      }),
    userId: joi.number().integer().positive().optional().messages({
      "number.base": "User ID must be a number",
      "number.integer": "User ID must be an integer",
      "number.positive": "User ID must be a positive number",
    }),
    remarks: joi.string().trim().allow("").optional().messages({
      "string.base": "Remarks must be a string",
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

module.exports = {
  revenuePostValidation,
  revenuePutValidation,
};
