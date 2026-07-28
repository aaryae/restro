const joi = require("joi");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const httpStatus = require("http-status");

const supplierPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().trim().min(2).required().messages({
      "string.base": "Name must be a string",
      "string.empty": "Name cannot be empty",
      "any.required": "Name is required",
    }),
    supplier_code: joi
      .string()
      .trim()
      .min(2)
      .pattern(/^[A-Za-z][A-Za-z0-9]*$/)
      .required()
      .messages({
        "string.base": "Supplier code must be a string",
        "string.empty": "Supplier code cannot be empty",
        "string.pattern.base":
          "Supplier code must start with a letter and contain only alphanumeric characters",
        "any.required": "Supplier code is required",
      }),
    address: joi.string().trim().min(2).optional().allow(null).messages({
      "string.base": "Address must be a string",
      "string.empty": "Address cannot be empty",
    }),
    contact_number: joi
      .string()
      .trim()
      .pattern(/^\d+$/)
      .min(10)
      .max(20)
      .optional()
      .allow(null)
      .messages({
        "string.base": "Contact number must be a string",
        "string.empty": "Contact number cannot be empty",
        "string.pattern.base": "Contact number must contain only digits",
        "string.min": "Contact number must be at least 10 digits",
        "string.max": "Contact number cannot exceed 20 digits",
      }),
    email: joi.string().email().optional().allow(null).messages({
      "string.base": "Email must be a string",
      "string.email": "Email must be a valid email address",
    }),
    pan_vat_number: joi.string().trim().optional().allow(null).messages({
      "string.base": "PAN/VAT number must be a string",
    }),
    contact_person: joi.string().trim().min(2).optional().allow(null).messages({
      "string.base": "Contact person must be a string",
      "string.empty": "Contact person cannot be empty",
      "any.required": "Contact person is required",
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

const supplierPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().trim().min(2).optional(),
    supplier_code: joi
      .string()
      .trim()
      .min(2)
      .pattern(/^[A-Za-z][A-Za-z0-9]*$/)
      .optional()
      .messages({
        "string.pattern.base":
          "Supplier code must start with a letter and contain only alphanumeric characters",
      }),
    address: joi.string().trim().min(2).optional().allow(null),
    contact_number: joi
      .string()
      .trim()
      .pattern(/^\d+$/)
      .min(10)
      .max(20)
      .optional()
      .allow(null)
      .messages({
        "string.pattern.base": "Contact number must contain only digits",
        "string.min": "Contact number must be at least 10 digits",
        "string.max": "Contact number cannot exceed 20 digits",
      }),
    email: joi.string().email().optional().allow(null),
    pan_vat_number: joi.string().trim().optional().allow(null),
    contact_person: joi.string().trim().min(2).optional().allow(null),
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
  supplierPostValidation,
  supplierPutValidation,
};
