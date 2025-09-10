"use strict";

const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const openItemPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().trim().min(1).required().messages({
      "string.base": "Name must be a string",
      "string.min": "Name must be at least 1 character",
      "any.required": "Name is required",
    }),
    alias: joi
      .alternatives()
      .try(joi.array().items(joi.string()), joi.object())
      .optional()
      .messages({
        "alternatives.types": "Alias must be an array of strings or an object",
      }),
    description: joi.string().optional().messages({
      "string.base": "Description must be a string",
    }),
    quantity: joi.number().integer().min(1).required().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
      "any.required": "Quantity is required",
    }),
    price: joi.number().precision(2).min(0).optional().messages({
      "number.base": "Price must be a number",
      "number.precision": "Price must have at most 2 decimal places",
      "number.min": "Price must be non-negative",
    }),
    stockStatus: joi
      .string()
      .valid("in_stock", "out_of_stock", "low_stock")
      .default("in_stock")
      .optional()
      .messages({
        "string.base": "Stock status must be a string",
        "any.only":
          "Stock status must be one of: in_stock, out_of_stock, low_stock",
      }),
    mediaArr: joi.array().items(joi.string()).optional().messages({
      "array.base": "Media array must be an array",
      "string.base": "Each media item must be a string",
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

const openItemPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().trim().min(1).optional().messages({
      "string.base": "Name must be a string",
      "string.min": "Name must be at least 1 character",
    }),
    slug: joi.string().trim().min(1).optional().messages({
      "string.base": "Slug must be a string",
      "string.min": "Slug must be at least 1 character",
    }),
    alias: joi
      .alternatives()
      .try(joi.array().items(joi.string()), joi.object())
      .optional()
      .messages({
        "alternatives.types": "Alias must be an array of strings or an object",
      }),
    description: joi.string().optional().messages({
      "string.base": "Description must be a string",
    }),
    quantity: joi.number().integer().min(1).optional().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
    }),
    price: joi.number().precision(2).min(0).optional().messages({
      "number.base": "Price must be a number",
      "number.precision": "Price must have at most 2 decimal places",
      "number.min": "Price must be non-negative",
    }),
    stockStatus: joi
      .string()
      .valid("in_stock", "out_of_stock", "low_stock")
      .optional()
      .messages({
        "string.base": "Stock status must be a string",
        "any.only":
          "Stock status must be one of: in_stock, out_of_stock, low_stock",
      }),
    mediaArr: joi.array().items(joi.string()).optional().messages({
      "array.base": "Media array must be an array",
      "string.base": "Each media item must be a string",
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
  openItemPostValidation,
  openItemPutValidation,
};
