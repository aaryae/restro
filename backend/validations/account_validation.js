const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const accountPostValidation = async (req, res, next) => {
  const joiModel = joi.object({
    accountType: joi
      .string()
      .valid("cash", "bank", "wallet")
      .required()
      .messages({
        "string.base": "Account type must be a string",
        "any.only": "Account type must be one of 'cash', 'bank', or 'wallet'",
        "any.required": "Account type is required",
      }),
    openingBalance: joi.number().precision(2).min(0.0).required().messages({
      "number.base": "Opening balance must be a number",
      "number.precision": "Opening balance must have up to 2 decimal places",
      "number.min": "Opening balance must be at least 0",
      "any.required": "Opening balance is required",
    }),
    description: joi.string().trim().allow("").optional().messages({
      "string.base": "Description must be a string",
    }),
    bankAccountName: joi
      .string()
      .trim()
      .when("accountType", {
        is: "bank",
        then: joi.required(),
        otherwise: joi.forbidden(),
      })
      .messages({
        "string.base": "Bank account name must be a string",
        "any.required": "Bank account name is required for bank accounts",
        "any.unknown": "Bank account name is not allowed for non-bank accounts",
      }),
    bankAccountNumber: joi
      .string()
      .trim()
      .when("accountType", {
        is: "bank",
        then: joi.required(),
        otherwise: joi.forbidden(),
      })
      .messages({
        "string.base": "Bank account number must be a string",
        "any.required": "Bank account number is required for bank accounts",
        "any.unknown":
          "Bank account number is not allowed for non-bank accounts",
      }),
    walletAccountName: joi
      .string()
      .trim()
      .when("accountType", {
        is: "wallet",
        then: joi.required(),
        otherwise: joi.forbidden(),
      })
      .messages({
        "string.base": "Wallet account name must be a string",
        "any.required": "Wallet account name is required for wallet accounts",
        "any.unknown":
          "Wallet account name is not allowed for non-wallet accounts",
      }),
    walletId: joi
      .string()
      .trim()
      .when("accountType", {
        is: "wallet",
        then: joi.required(),
        otherwise: joi.forbidden(),
      })
      .messages({
        "string.base": "Wallet ID must be a string",
        "any.required": "Wallet ID is required for wallet accounts",
        "any.unknown": "Wallet ID is not allowed for non-wallet accounts",
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
  accountPostValidation,
};
