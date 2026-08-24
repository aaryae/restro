const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const mediaPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().optional().label("name"),
    caption: joi.string().optional().label("caption"),
    description: joi.string().optional().label("description"),
    mediaCategoryId: joi.number().required().label("mediaCategoryId"),
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

const changeNameValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().required().label("name"),
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

const mediaBulkDeleteValidation = async (req, res, next) => {
  let joiModel = joi.object({
    mediaIds: joi.array().items(joi.number()).required().label("mediaIds"),
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
  mediaPostValidation,
  changeNameValidation,
  mediaBulkDeleteValidation,
};
