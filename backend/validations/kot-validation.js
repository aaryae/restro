const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");
const {
  validateRequestBody,
  validateRequestParams,
} = require("../helpers/validator-helper");

const kotPutValidation = async (req, res, next) => {
  // Validate req.params
  const paramsSchema = joi.object({
    id: joi.number().integer().positive().required().label("KOT ID"),
  });

  const paramsErrors = await validateRequestParams(req, res, paramsSchema);
  if (!isEmpty(paramsErrors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      paramsErrors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }

  // Validate req.body
  const bodySchema = joi.object({
    status: joi
      .string()
      .valid("pending", "preparing", "ready", "cancelled")
      .required()
      .label("Status"),
  });

  const bodyErrors = await validateRequestBody(req, res, bodySchema);
  if (!isEmpty(bodyErrors)) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      bodyErrors,
      messageConstant.EN.INPUT_ERROR,
      null,
    );
  }

  return next();
};

module.exports = { kotPutValidation };
