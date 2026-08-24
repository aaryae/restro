const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const createDepartmentValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().min(2).max(100).required(),
    description: joi.string().allow(null, "").optional(),
    isActive: joi.boolean().optional(),
    AvgPreparationTime: joi.number().integer().min(0).optional(),
    displayOrder: joi.number().integer().min(0).optional(),
    color: joi
      .string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
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

const updateDepartmentValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().min(2).max(100).optional(),
    description: joi.string().allow(null, "").optional(),
    isActive: joi.boolean().optional(),
    AvgPreparationTime: joi.number().integer().min(0).optional(),
    displayOrder: joi.number().integer().min(0).optional(),
    color: joi
      .string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
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
  createDepartmentValidation,
  updateDepartmentValidation,
};
