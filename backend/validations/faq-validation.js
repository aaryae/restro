const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const faqPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    question: joi.string().required().label("Question"),
    answer: joi.string().required().min(1).max(1000).label("Answer"),
    pathName: joi.string().required().label("Path Name"),
    pathLink: joi.string().required().label("Path Link"),
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

const faqPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    question: joi.string().required().label("Question"),
    answer: joi.string().required().min(1).max(1000).label("Answer"),
    pathName: joi.string().required().label("Path Name"),
    pathLink: joi.string().required().label("Path Link"),
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
  faqPostValidation,
  faqPutValidation,
};
