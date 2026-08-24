const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { ROLE_TYPES } = require("../constants/value-constants");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const rolesPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().required().label("Title"),
    description: joi.string().optional().allow(null, "").label("Description"),
    roleType: joi
      .string()
      .optional()
      .valid(...ROLE_TYPES)
      .label("Role Type"),
    isActive: joi.boolean().label("Is Active"),
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

const rolesPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().optional().label("Title"),
    description: joi.string().optional().allow(null, "").label("Description"),
    roleType: joi
      .string()
      .optional()
      .valid(...ROLE_TYPES)
      .label("Role Type"),
    isActive: joi.boolean().optional().label("Is Active"),
    role_actions: joi
      .array()
      .items(
        joi.object({
          roleMenuActionId: joi
            .number()
            .integer()
            .positive()
            .required()
            .messages({
              "number.base": "roleMenuActionId must be a number.",
              "number.integer": "roleMenuActionId must be an integer.",
              "number.positive": "roleMenuActionId must be a positive number.",
              "any.required": "roleMenuActionId is required.",
            }),
        }),
      )
      .min(1)
      .optional()
      .messages({
        "array.base": "role_actions must be an array.",
        "array.min": "role_actions must contain at least one item if provided.",
      }),
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
const rolesDetailViewValidation = async (req, res, next) => {
  let joiModel = joi.object({
    id: joi
      .number()
      .custom((value, helpers) => {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          return helpers.error("any.invalid", {
            message: "ID must be a valid number",
          });
        }
        return parsed; // Return the parsed number to pass validation
      })
      .required()
      .label("ID"),
  });
  const errors = await validateRequestParams(req, res, joiModel);
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
  rolesPostValidation,
  rolesPutValidation,
  rolesDetailViewValidation,
};
