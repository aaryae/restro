const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const productPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    productCategoryId: joi.number().integer().positive().required(),
    name: joi.string().trim().min(1).required(),
    departmentId: joi.number().integer().positive().required(),
    alias: joi
      .alternatives()
      .try(joi.array().items(joi.string()), joi.object()),
    description: joi.string().required(),
    // quantity: joi.number().integer().min(0).required(),
    price: joi.number().precision(2).min(0).required(),
    mediaArr: joi.array().items(joi.string()).optional().default([]),
    hasVariant: joi.boolean().default(false),
    variants: joi.when("hasVariant", {
      is: true,
      then: joi
        .array()
        .items(
          joi.object({
            name: joi.string().trim().min(1).required().messages({
              "string.base": "Variant name must be a string",
              "string.min": "Variant name must be at least 1 character",
              "any.required": "Variant name is required",
            }),
            description: joi.string().optional(),
            price: joi.number().precision(2).min(0).required().messages({
              "number.base": "Variant price must be a number",
              "number.min": "Variant price must be non-negative",
              "any.required": "Variant price is required",
            }),
            quantity: joi.number().integer().min(0).required().messages({
              "number.base": "Variant quantity must be a number",
              "number.integer": "Variant quantity must be an integer",
              "number.min": "Variant quantity must be non-negative",
              "any.required": "Variant quantity is required",
            }),
          }),
        )
        .min(1)
        .required()
        .messages({
          "array.min":
            "At least one variant is required when hasVariant is true",
          "any.required": "Variants array is required when hasVariant is true",
        }),
      otherwise: joi.array().max(0).optional().messages({
        "array.max": "Variants array must be empty when hasVariant is false",
      }),
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

const productPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    productCategoryId: joi.number().integer().positive().optional(),
    name: joi.string().trim().min(1).optional(),
    departmentId: joi.number().integer().positive().optional(),
    alias: joi
      .alternatives()
      .try(joi.array().items(joi.string()), joi.object()),
    description: joi.string().optional(),
    // quantity: joi.number().integer().min(0).optional(),
    price: joi.number().precision(2).min(0).optional(),
    order: joi.number().integer().min(0).optional(),
    mediaArr: joi.array().items(joi.string()).optional().default([]),
    hasVariant: joi.boolean().optional(),
    variants: joi.when("hasVariant", {
      is: true,
      then: joi
        .array()
        .items(
          joi.object({
            name: joi.string().trim().min(1).required().messages({
              "string.base": "Variant name must be a string",
              "string.min": "Variant name must be at least 1 character",
              "any.required": "Variant name is required",
            }),
            description: joi.string().optional(),
            price: joi.number().precision(2).min(0).required().messages({
              "number.base": "Variant price must be a number",
              "number.min": "Variant price must be non-negative",
              "any.required": "Variant price is required",
            }),
            quantity: joi.number().integer().min(0).required().messages({
              "number.base": "Variant quantity must be a number",
              "number.integer": "Variant quantity must be an integer",
              "number.min": "Variant quantity must be non-negative",
              "any.required": "Variant quantity is required",
            }),
          }),
        )
        .min(1)
        .optional()
        .messages({
          "array.min":
            "At least one variant is required when hasVariant is true",
        }),
      otherwise: joi.array().max(0).optional().messages({
        "array.max": "Variants array must be empty when hasVariant is false",
      }),
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

const orderPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    orders: joi
      .array()
      .required()
      .min(1)
      .items(
        joi.object({
          id: joi.number().integer().positive().required().messages({
            "number.base": "ID must be a number",
            "number.integer": "ID must be an integer",
            "number.positive": "ID must be a positive number",
            "any.required": "ID is required",
          }),
          order: joi.number().integer().min(0).required().messages({
            "number.base": "Order must be a number",
            "number.integer": "Order must be an integer",
            "number.min": "Order must be non-negative",
            "any.required": "Order is required",
          }),
        }),
      )
      .unique((a, b) => a.id === b.id)
      .messages({
        "array.base": "Request body must be an array",
        "array.min": "Array must not be empty",
        "array.unique": "Duplicate IDs are not allowed",
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
  productPostValidation,
  productPutValidation,
  orderPutValidation,
};
