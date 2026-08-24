const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const loginValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().required().label("email"),
    password: joi.string().required().min(1).label("password"),
    // captchaToken: joi.string().required().min(1).label("captchaToken"),
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

const changePasswordValidation = async (req, res, next) => {
  let joiModel = joi.object({
    oldPassword: joi.string().required().label("oldPassword"),
    newPassword: joi.string().required().min(1).label("newPassword"),
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

const registerValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().required().label("email"),
    password: joi.string().required().min(1).label("password"),
    username: joi.string().required().label("username"),
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

// use for verifyToken also
const verifyEmailValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().required().label("email"),
    otp: joi.string().required().label("otp"),
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
// use for generateFPtoken also
const regenerateTokenValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().required().label("email"),
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

const forgetPasswordValidation = async (req, res, next) => {
  let joiModel = joi.object({
    email: joi.string().required().label("email"),
    password: joi.string().required().min(1).label("password"),
    token: joi.string().required().min(1).label("token"),
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
    username: joi.string().optional().min(2).label("username").allow(null),
    firstName: joi.string().optional().min(2).label("firstName").allow(null),
    lastName: joi.string().optional().min(2).label("lastName").allow(null),
    addressPrimary: joi
      .string()
      .optional()
      .min(2)
      .label("addressPrimary")
      .allow(null),
    addressSecondary: joi
      .string()
      .optional()
      .min(2)
      .label("addressSecondary")
      .allow(null),
    city: joi.string().optional().min(2).label("city").allow(null),
    pinCode: joi.string().optional().min(2).label("pinCode").allow(null),
    imageUrl: joi.string().optional().label("imageUrl").allow(null),
    gender: joi.string().valid("male", "female", "other").optional(),
    mobileNo: joi.string().optional().max(10).label("mobileNo").allow(null),
    mobilePrefix: joi.string().optional().max(3).label("imageUrl").allow(null),
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

const updateByAdminValidation = async (req, res, next) => {
  let joiModel = joi.object({
    username: joi.string().optional().min(2).label("username").allow(null),
    imageUrl: joi.string().optional().label("imageUrl").allow(null),
    gender: joi.string().valid("male", "female", "other").optional(),
    mobileNo: joi.string().optional().max(10).label("imageUrl"),
    mobilePrefix: joi.string().optional().max(3).label("imageUrl"),
    isActive: joi.boolean().optional().label("isActive"),
    isDeleted: joi.boolean().optional().label("isDeleted"),
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

const resetPasswordValidation = async (req, res, next) => {
  let joiModel = joi.object({
    password: joi.string().required().label("password"),
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
  loginValidation,
  changePasswordValidation,
  forgetPasswordValidation,
  regenerateTokenValidation,
  resetPasswordValidation,
  updateValidation,
  updateByAdminValidation,
  verifyEmailValidation,
  registerValidation,
};
