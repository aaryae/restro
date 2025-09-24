"use strict";

const Joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const {
  validateRequestBody,
  validateRequestQuery,
} = require("../helpers/validator-helper");

const getByIdValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    id: Joi.number().integer().required().messages({
      "number.base": "Permission ID must be a number",
      "number.integer": "Permission ID must be an integer",
      "any.required": "Permission ID is required",
    }),
  });

  const errors = await validateRequestBody(req, res, joiModel, {
    params: true,
  });
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

  next();
};

const createValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    userId: Joi.number().integer().required().messages({
      "number.base": "User ID must be a number",
      "number.integer": "User ID must be an integer",
      "any.required": "User ID is required",
    }),
    accountId: Joi.number().integer().required().messages({
      "number.base": "Account ID must be a number",
      "number.integer": "Account ID must be an integer",
      "any.required": "Account ID is required",
    }),
    canView: Joi.boolean().default(false).messages({
      "boolean.base": "Can View must be a boolean",
    }),
    canEdit: Joi.boolean().default(false).messages({
      "boolean.base": "Can Edit must be a boolean",
    }),
    canDelete: Joi.boolean().default(false).messages({
      "boolean.base": "Can Delete must be a boolean",
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

  next();
};

const updateValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    // id: Joi.number().integer().required().messages({
    //   "number.base": "Permission ID must be a number",
    //   "number.integer": "Permission ID must be an integer",
    //   "any.required": "Permission ID is required",
    // }),
    canView: Joi.boolean().optional().messages({
      "boolean.base": "Can View must be a boolean",
    }),
    canEdit: Joi.boolean().optional().messages({
      "boolean.base": "Can Edit must be a boolean",
    }),
    canDelete: Joi.boolean().optional().messages({
      "boolean.base": "Can Delete must be a boolean",
    }),
  });

  const errors = await validateRequestBody(req, res, joiModel, {
    params: true,
  });
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

  next();
};

const deleteValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    id: Joi.number().integer().required().messages({
      "number.base": "Permission ID must be a number",
      "number.integer": "Permission ID must be an integer",
      "any.required": "Permission ID is required",
    }),
  });

  const errors = await validateRequestBody(req, res, joiModel, {
    params: true,
  });
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

  next();
};

const getByUserIdValidation = async (req, res, next) => {
  const joiModel = Joi.object({
    userId: Joi.number().integer().required().messages({
      "number.base": "User ID must be a number",
      "number.integer": "User ID must be an integer",
      "any.required": "User ID is required",
    }),
  });

  const errors = await validateRequestBody(req, res, joiModel, {
    params: true,
  });
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

  next();
};

module.exports = {
  getByIdValidation,
  createValidation,
  updateValidation,
  deleteValidation,
  getByUserIdValidation,
};
