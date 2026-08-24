const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const pagePostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().required().label("title"),
    header_title: joi.string().required().label("Header Title"),
    page_description: joi
      .string()
      .required()
      .min(1)
      .max(1000)
      .label("Page description"),
    og_image: joi.string().optional().label("OG Image"),
    og_description: joi.string().optional().label("OG description"),
    meta_title: joi.string().optional().label("Meta Title"),
    meta_description: joi.string().optional().label("OG description"),
    meta_keywords: joi.array().items(joi.string().optional()).optional(),
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

const pagePutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().optional().label("title"),
    header_title: joi.string().optional().label("Header Title"),
    page_description: joi
      .string()
      .required()
      .min(1)
      .max(1000)
      .label("Page description"),
    og_image: joi.string().optional().label("OG Image"),
    og_description: joi.string().optional().label("OG description"),
    meta_title: joi.string().optional().label("Meta Title"),
    meta_description: joi.string().optional().label("OG description"),
    meta_keywords: joi.array().items(joi.string().optional()).optional(),
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
  pagePostValidation,
  pagePutValidation,
};
