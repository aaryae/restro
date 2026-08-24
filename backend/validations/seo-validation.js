const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const seoPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().required().label("Title"),
    description: joi.string().required().min(1).max(1000).label("Description"),
    pageName: joi.string().required().label("Page Name"),
    author: joi.string().required().label("Author"),
    keywords: joi.array().items(joi.string()).required().label("Keywords"),
    og_title: joi.string().required().label("OG Title"),
    og_description: joi
      .string()
      .required()
      .min(1)
      .max(1000)
      .label("OG Description"),
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

const seoPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().optional().label("Title"),
    description: joi.string().optional().min(1).max(1000).label("Description"),
    pageName: joi.string().optional().label("Page"),
    author: joi.string().optional().label("Author"),
    keywords: joi.array().items(joi.string()).optional().label("Keywords"),
    og_title: joi.string().optional().label("OG Title"),
    og_description: joi
      .string()
      .optional()
      .min(1)
      .max(1000)
      .label("OG Description"),
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
  seoPostValidation,
  seoPutValidation,
};
