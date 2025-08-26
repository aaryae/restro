const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");



const createValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().optional().label("email"),
    password: joi.string().required().min(1).label("password"),
    firstName: joi.string().required().label("firstName"),
    lastName: joi.string().optional().label("lastName"),
    mobileNo: joi.string().required().min(10).label("mobileNo"),
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
const updateValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().optional().label("email"),
    password: joi.string().optional().min(1).label("password"),
    firstName: joi.string().optional().label("firstName"),
    lastName: joi.string().optional().label("lastName"),
    mobileNo: joi.string().optional().min(10).label("mobileNo"),
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
  createValidation,
  updateValidation
};
