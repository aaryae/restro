const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const { GENDER } = require("../constants/value-constants");

/** Match admin Security tab rules so API cannot be bypassed with weak passwords. */
const strongPassword = joi
  .string()
  .trim()
  .min(8)
  .max(32)
  .pattern(/[A-Z]/)
  .pattern(/[a-z]/)
  .pattern(/[0-9]/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must not exceed 32 characters",
    "string.pattern.base":
      "Password must include uppercase, lowercase, and a number",
  });

const loginValidation = async (req, res, next) => {
  let joiModel = joi
    .object({
      username: joi.string().trim().min(1).required().label("username"),
      password: joi.string().required().label("password"),
      // Cafe domain/slug is required so the same username can exist in two cafes.
      cafeSlug: joi.string().trim().lowercase().min(1).max(64).label("cafeSlug"),
      domain: joi.string().trim().lowercase().min(1).max(255).label("domain"),
      captchaToken: joi.string().optional().allow(null, "").label("captchaToken"),
    })
    .or("cafeSlug", "domain")
    .messages({
      "object.missing":
        "Cafe domain is required. Sign in with your cafe domain, username, and password.",
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

const createUserValidation = async (req, res, next) => {
  let joiModel = joi
    .object({
      username: joi.string().required().label("username"),
      firstName: joi.string().optional().allow(null).label("firstName"),
      lastName: joi.string().optional().allow(null).label("lastName"),
      email: joi.string().optional().allow(null, "").email().label("email"),
      gender: joi
        .string()
        .valid(...GENDER)
        .required()
        .label("gender"),
      imageUrl: joi.string().optional().allow(null).label("imageUrl"),
      password: strongPassword.label("password"),
      isActive: joi.boolean().optional().label("isActive"),
      mobileNo: joi
        .string()
        .pattern(/^[0-9]{10}$/) // Matches exactly 10 digits
        .required()
        .messages({
          "string.pattern.base": "Mobile number must be exactly 10 digits",
        }),
      mobilePrefix: joi
        .string()
        .pattern(/^\+[1-9]\d{0,3}$/)
        .required()
        .label("mobilePrefix")
        .messages({
          "string.pattern.base":
            "Mobile prefix must be a valid country code like +977",
        }),
      roleId: joi.number().integer().positive().required().label("role"),
      // for future use
      // supervisorId: joi.number().optional().label("supervisorId"),
    })
    .unknown(false);
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

const updateUserValidation = async (req, res, next) => {
  let joiModel = joi
    .object({
      username: joi.string().optional().label("username"),
      firstName: joi.string().optional().allow(null).label("firstName"),
      lastName: joi.string().optional().allow(null).label("lastName"),
      email: joi.string().optional().email().label("email"),
      gender: joi
        .string()
        .valid(...GENDER)
        .optional()
        .label("gender"),
      imageUrl: joi.string().optional().allow(null).label("imageUrl"),
      isActive: joi.boolean().optional().label("isActive"),
      mobileNo: joi
        .string()
        .pattern(/^[0-9]{10}$/) // Matches exactly 10 digits
        .optional()
        .messages({
          "string.pattern.base": "Mobile number must be exactly 10 digits",
        }),
      mobilePrefix: joi
        .string()
        .pattern(/^\+[1-9]\d{0,3}$/)
        .optional()
        .label("mobilePrefix")
        .messages({
          "string.pattern.base":
            "Mobile prefix must be a valid country code like +977",
        }),
      roleId: joi.number().optional().label("role"),
      // for future use
      // supervisorId: joi.number().optional().label("supervisorId"),
    })
    .unknown(false);

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

const updatePublicUserValidation = async (req, res, next) => {
  let joiModel = joi
    .object({
      username: joi.string().optional().label("username"),
      firstName: joi.string().optional().label("firstName"),
      lastName: joi.string().optional().label("lastName"),
      email: joi.string().optional().email().label("email"),
      gender: joi
        .string()
        .valid(...GENDER)
        .optional()
        .label("gender"),
      imageUrl: joi.string().optional().label("imageUrl"),
      mobileNo: joi
        .string()
        .pattern(/^[0-9]{10}$/) // Matches exactly 10 digits
        .optional()
        .messages({
          "string.pattern.base": "Mobile number must be exactly 10 digits",
        }),
      mobilePrefix: joi
        .string()
        .pattern(/^\+[1-9]\d{0,3}$/)
        .optional()
        .label("mobilePrefix")
        .messages({
          "string.pattern.base":
            "Mobile prefix must be a valid country code like +977",
        }),
      // for future use
      // supervisorId: joi.number().optional().label("supervisorId"),
    })
    .unknown(false);

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

const deleteUserValidation = async (req, res, next) => {
  let joiModel = joi.object({
    isDeleted: joi.boolean().required().label("isDeleted"),
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

const passwordValidation = async (req, res, next) => {
  let joiModel = joi.object({
    newPassword: strongPassword.label("newPassword"),
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
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  passwordValidation,
  updatePublicUserValidation,
};
