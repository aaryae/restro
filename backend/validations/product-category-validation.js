const joi = require("joi");

const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const { validateRequestBody } = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");

const productCategoryPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().required().label("Name"),
    imageUrl: joi.string().optional().label("Image Url"),
    imageUrlSecondary: joi.string().optional().label("Image Secondary Url"),
    description: joi.string().optional().label("Description"),
    // loyaltyRequired: joi.number().required().label("Loyalty Required"),
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

const productCategoryPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().optional().label("Name"),
    imageUrl: joi.string().optional().label("Image Url"),
    imageUrlSecondary: joi.string().optional().label("Image Secondary Url"),
    description: joi.string().optional().label("Description"),
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
  productCategoryPostValidation,
  productCategoryPutValidation,
};
