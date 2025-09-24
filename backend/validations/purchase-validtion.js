const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const purchaseItemSchema = Joi.object({
  categoryId: Joi.number().integer().positive().optional(),
  hsCode: Joi.string().max(50).optional().allow(null),
  particulars: Joi.string().trim().min(1).required().messages({
    "string.base": "Particulars must be a string",
    "string.min": "Particulars must be at least 1 character",
    "any.required": "Particulars is required",
  }),
  quantity: Joi.number().precision(2).positive().required().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
    "any.required": "Quantity is required",
  }),
  rate: Joi.number().precision(2).positive().required().messages({
    "number.base": "Rate must be a number",
    "number.positive": "Rate must be positive",
    "any.required": "Rate is required",
  }),
  isTaxable: Joi.boolean().default(true),
});

const purchasePostValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    supplierId: Joi.number().integer().positive().required().messages({
      "number.base": "Supplier ID must be a number",
      "number.positive": "Supplier ID must be positive",
      "any.required": "Supplier ID is required",
    }),
    invoiceDate: Joi.date().iso().required().messages({
      "date.base": "Invoice date must be a valid ISO date",
      "any.required": "Invoice date is required",
    }),
    invoiceNumber: Joi.string().trim().min(1).max(100).optional().allow(null),
    paymentTerms: Joi.string()
      .valid("cash", "cheque", "credit")
      .required()
      .messages({
        "any.only": "Payment terms must be one of: cash, cheque, credit",
        "any.required": "Payment terms is required",
      }),
    accountId: Joi.number().integer().positive().required().messages({
      "number.base": "Account ID must be a number",
      "number.positive": "Account ID must be positive",
      "any.required": "Account ID is required",
    }),
    discountAmount: Joi.number().precision(2).min(0).default(0).messages({
      "number.base": "Discount amount must be a number",
      "number.min": "Discount amount must be non-negative",
    }),
    items: Joi.array().items(purchaseItemSchema).min(1).required().messages({
      "array.base": "Items must be an array",
      "array.min": "At least one item is required",
      "any.required": "Items array is required",
    }),
    notes: Joi.string().optional().allow(null),
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

const purchasePutValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    supplierId: Joi.number().integer().positive().optional(),
    invoiceDate: Joi.date().iso().optional(),
    invoiceNumber: Joi.string().trim().min(1).max(100).optional().allow(null),
    paymentTerms: Joi.string().valid("cash", "cheque", "credit").optional(),
    accountId: Joi.number().integer().positive().optional(),
    discountAmount: Joi.number().precision(2).min(0).optional(),
    items: Joi.array().items(purchaseItemSchema).min(1).optional(),
    notes: Joi.string().optional().allow(null),
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

const completePurchaseValidation = async (req, res, next) => {
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

const payPurchaseValidation = async (req, res, next) => {
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

const cancelPurchaseValidation = async (req, res, next) => {
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

const unpaidCreditsValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    supplierId: Joi.number().integer().positive().optional(),
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
  purchasePostValidation,
  purchasePutValidation,
  completePurchaseValidation,
  payPurchaseValidation,
  cancelPurchaseValidation,
  unpaidCreditsValidation,
};
