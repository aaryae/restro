const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const transferPostValidation = async (req, res, next) => {
  const joiModel = joi.object({
    fromAccountId: joi.number().integer().required().messages({
      "number.base": "Source account ID must be a number",
      "number.integer": "Source account ID must be an integer",
      "any.required": "Source account ID is required",
    }),
    toAccountId: joi.number().integer().required().messages({
      "number.base": "Destination account ID must be a number",
      "number.integer": "Destination account ID must be an integer",
      "any.required": "Destination account ID is required",
    }),
    userId: joi.number().integer().required().messages({
      "number.base": "User ID must be a number",
      "number.integer": "User ID must be an integer",
      "any.required": "User ID is required",
    }),
    amount: joi.number().precision(2).min(0.01).required().messages({
      "number.base": "Amount must be a number",
      "number.precision": "Amount must have up to 2 decimal places",
      "number.min": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    remarks: joi.string().trim().not("").required().messages({
      "string.base": "Remarks must be a string",
      "string.empty": "Remarks cannot be empty",
      "any.required": "Remarks is required",
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

  // Custom validation: Ensure fromAccountId and toAccountId are different
  const { fromAccountId, toAccountId } = req.body;
  if (fromAccountId === toAccountId) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      { fromAccountId: "Source and destination accounts cannot be the same" },
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }

  return next();
};

module.exports = { transferPostValidation };
