const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const activeEmailTemplatePostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    actionKey: joi.string().required().label("actionKey"),
    templateId: joi.number().optional().label("templateId"),
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

const activeEmailTemplatePutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    actionKet: joi.string().optional().label("templateKey"),
    templateId: joi.number().optional().label("id"),
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
  activeEmailTemplatePostValidation,
  activeEmailTemplatePutValidation,
};
