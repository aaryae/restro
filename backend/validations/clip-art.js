const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const clipArtPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    positionNumber: joi.number().required().label("Position Number"),
    departmentId: joi.number().required().label("Department ID"),
    img_png: joi.string().required().label("Image PNG"),
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

const clipArtPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    positionNumber: joi.number().optional().label("Position Number"),
    departmentId: joi.number().optional().label("Department ID"),
    img_png: joi.string().optional().label("Image PNG"),
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
  clipArtPostValidation,
  clipArtPutValidation,
};
