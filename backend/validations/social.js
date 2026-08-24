const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const companySocialPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    settingId: joi.number().required(),
    social_title: joi.string().min(1).max(20).required(),
    social_url: joi.string().required(),
    fav_icon: joi.string().required(),
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

const companySocialPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    social_title: joi.string().min(1).max(20).optional(),
    social_url: joi.string().optional(),
    fav_icon: joi.string().optional(),
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

module.exports = { companySocialPostValidation, companySocialPutValidation };
