const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const qnaPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    employeeId: joi.number().required().label("employeeId"),
    qno: joi.number().required().label("Qno"),
    question: joi.string().required().label("Question"),
    answer: joi.string().required().label("Answer"),
    img: joi.string().optional().allow("").label("Image"),
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

const qnaPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    qno: joi.number().optional().label("Qno"),
    question: joi.string().optional().label("Question"),
    answer: joi.string().optional().label("Answer"),
    img: joi.string().optional().allow("").label("Image"),
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
  qnaPostValidation,
  qnaPutValidation,
};
