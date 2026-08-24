const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const emailTemplatePostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    templateName: joi.string().required().label("templateName"),
    templateKey: joi.string().required().label("templateKey"),
    variables: joi.array().items(joi.string()).allow(null),
    subject: joi.string().required(),
    alternateText: joi.string().allow(null, ""),
    body: joi.string().required(),
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

const emailTemplatePutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    templateName: joi.string().optional().label("templateName"),
    templateKey: joi.string().optional().label("templateKey"),
    variables: joi.array().items(joi.string()).allow(null),
    subject: joi.string().optional(),
    alternateText: joi.string().optional().allow(null, ""),
    body: joi.string().required(),
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
  emailTemplatePostValidation,
  emailTemplatePutValidation,
};
