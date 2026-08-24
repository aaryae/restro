const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const departmentPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().required().label("name"),
    description: joi.string().allow(null, "").optional().max(1000).label("Description"),
    color: joi.string().required().label("Color"),
    subNameOne: joi.string().optional().label("Sub Name One"),
    subNameTwo: joi.string().optional().label("Sub Name Two"),
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

const departmentPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().optional().label("name"),
    description: joi
      .string()
      .optional()
      .allow(null, "")
      .max(1000)
      .label("Description"),
    color: joi.string().optional().label("Color"),
    subNameOne: joi.string().optional().allow(null).label("Sub Name One"),
    subNameTwo: joi.string().optional().allow(null).label("Sub Name Two"),
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
  departmentPostValidation,
  departmentPutValidation,
};
