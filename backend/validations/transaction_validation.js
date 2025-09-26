const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const transactionPostValidation = async (req, res, next) => {
  const joiModel = joi.object({
    accountId: joi.number().integer().positive().required().messages({
      "number.base": "Account ID must be a number",
      "number.integer": "Account ID must be an integer",
      "number.positive": "Account ID must be positive",
      "any.required": "Account ID is required",
    }),
    type: joi.string().valid("deposit", "withdraw").required().messages({
      "string.base": "Type must be a string",
      "any.only": "Type must be either 'deposit' or 'withdraw'",
      "any.required": "Transaction type is required",
    }),
    amount: joi.number().precision(2).positive().required().messages({
      "number.base": "Amount must be a number",
      "number.precision": "Amount must have up to 2 decimal places",
      "number.positive": "Amount must be positive",
      "any.required": "Amount is required",
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
  transactionPostValidation,
};
