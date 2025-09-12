const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const expensePostValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    cash_or_credit: Joi.string().valid("cash", "credit").required().messages({
      "any.only": "Cash or credit must be one of: cash, credit",
      "any.required": "Cash or credit is required",
    }),
    paymentMethod: Joi.string()
      .valid("cash", "card", "online")
      .required()
      .messages({
        "any.only": "Payment method must be one of: cash, card, online",
        "any.required": "Payment method is required",
      }),
    amount: Joi.number().precision(2).positive().required().messages({
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be positive",
      "any.required": "Amount is required",
    }),
    remarks: Joi.string().optional().allow(null),
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .allow(null)
      .messages({
        "number.base": "Category ID must be a number",
        "number.positive": "Category ID must be positive",
      }),
    accountId: Joi.number().integer().positive().required().messages({
      "number.base": "Account ID must be a number",
      "number.positive": "Account ID must be positive",
      "any.required": "Account ID is required",
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

const expensePutValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    cash_or_credit: Joi.string().valid("cash", "credit").optional(),
    paymentMethod: Joi.string().valid("cash", "card", "online").optional(),
    amount: Joi.number().precision(2).positive().optional(),
    remarks: Joi.string().optional().allow(null),
    categoryId: Joi.number().integer().positive().optional().allow(null),
    accountId: Joi.number().integer().positive().optional(),
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

const payExpenseValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    paymentAccountId: Joi.number().integer().positive().optional().messages({
      "number.base": "Payment account ID must be a number",
      "number.positive": "Payment account ID must be positive",
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

const cancelExpenseValidation = async (req, res, next) => {
  const joiModel = Joi.object({});
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
  expensePostValidation,
  expensePutValidation,
  payExpenseValidation,
  cancelExpenseValidation,
};
