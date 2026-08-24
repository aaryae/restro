const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const timeTableHeaderOnlyPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    heading: joi.string().required().label("heading"),
    sub_heading: joi.string().required().label("sub_heading"),
    img_one: joi.string().required().label("Image"),
    img_two: joi.string().required().label("Image"),
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
const timeTableHeaderPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    heading: joi.string().required().label("heading"),
    sub_heading: joi.string().required().label("sub_heading"),
    employeeId: joi.number().required().label("employeeId"),
    img_one: joi.string().required().label("Image"),
    img_two: joi.string().required().label("Image"),
    timeTable: joi
      .array()
      .items(
        joi.object({
          title: joi.string().required().label("Title"),
          description: joi.string().required().label("Description"),
          date: joi.string().required().label("Date"),
        }),
      )
      .optional()
      .label("Time Table"),
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

const timeTableHeaderPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    heading: joi.string().optional().label("heading"),
    sub_heading: joi.string().optional().label("sub_heading"),
    employeeId: joi.number().optional().label("employeeId"),
    img_one: joi.string().optional().label("Image"),
    img_two: joi.string().optional().label("Image"),
    timeTable: joi
      .array()
      .items(
        joi.object({
          id: joi.number().optional().label("Id"),
          title: joi.string().required().label("Title"),
          description: joi.string().required().label("Description"),
          date: joi.string().required().label("Date"),
        }),
      )
      .optional()
      .label("Time Table"),
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

const timeTablePostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    timeTableHeaderId: joi.number().required().label("timeTableHeaderId"),
    title: joi.string().required().label("title"),
    description: joi.string().required().label("description"),
    date: joi.string().required().label("date"),
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

const timeTablePutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    title: joi.string().optional().label("title"),
    description: joi.string().optional().label("description"),
    date: joi.string().optional().label("date"),
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
  timeTableHeaderPostValidation,
  timeTableHeaderPutValidation,
  timeTableHeaderOnlyPutValidation,
  timeTablePostValidation,
  timeTablePutValidation,
};
