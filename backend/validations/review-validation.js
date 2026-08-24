const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const reviewPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().required().label("title"),
    author: joi.string().required().label("author"),
    desc: joi.string().required().min(1).max(1000).label("Description"),
    rate: joi.number().required().min(1).max(5).label("rate"),
    is_published: joi.boolean().optional().label("isPublished"),
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

const reviewPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().optional().label("title"),
    author: joi.string().optional().label("author"),
    desc: joi.string().optional().min(1).max(1000).label("Description"),
    rate: joi.number().optional().min(1).max(5).label("rate"),
    is_published: joi.boolean().optional().label("isPublished"),
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
  reviewPostValidation,
  reviewPutValidation,
};
