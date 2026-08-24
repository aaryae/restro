const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const smtpPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    username: joi.string().required().label("username"),
    passkey: joi.string().required().label("passkey"),
    host: joi.string().required().label("host"),
    port: joi.number().required().label("port"),
    secure: joi.boolean().required().label("secure"),
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

const smtpPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    username: joi.string().optional().label("username"),
    passkey: joi.string().optional().label("passkey"),
    host: joi.string().optional().label("host"),
    port: joi.number().optional().label("port"),
    secure: joi.boolean().optional().label("secure"),
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
  smtpPostValidation,
  smtpPutValidation,
};
