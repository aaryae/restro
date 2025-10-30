const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const createFloorValidation = async (req, res, next) => {
  let joiModel = joi.object({
    floorNo: joi.string().required(),
    name: joi.string().required(),
    description: joi.string().allow(null, "").optional(),
    isActive: joi.boolean().optional(),
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

const updateFloorValidation = async (req, res, next) => {
  let joiModel = joi.object({
    floorNo: joi.string().optional(),
    name: joi.string().optional(),
    description: joi.string().allow(null, "").optional(),
    isActive: joi.boolean().optional(),
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

const updateFloorStatusValidation = async (req, res, next) => {
  let joiModel = joi.object({
    status: joi.string().valid("active", "inactive"),
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
  createFloorValidation,
  updateFloorValidation,
  updateFloorStatusValidation,
};
