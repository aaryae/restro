const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const bannerPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().min(1).required().messages({
      "string.empty": "Name is Required",
    }),
    video_url: joi.string().allow(null).optional(),
    bannerItems: joi
      .array()
      .items(
        joi.object({
          image: joi.string().min(1).required().messages({
            "string.empty": "Image is Required",
          }),
          caption: joi.string().optional(),
          captionCSS: joi.string().optional(),
          title: joi.string().min(1).required().messages({
            "string.empty": "Title is Required",
          }),
          titleCSS: joi.string().optional(),
          subTitle: joi.string().min(1).required().messages({
            "string.empty": "Sub Title is Required",
          }),
          subTitleCSS: joi.string().optional(),
        }),
      )
      .required(),
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

const bannerPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().min(1).optional().messages({
      "string.empty": "Name is Required",
    }),
    video_url: joi.string().allow(null).optional(),
    bannerItems: joi
      .array()
      .items(
        joi.object({
          image: joi.optional(),
          caption: joi.optional(),
          captionCSS: joi.optional(),
          title: joi.optional(),
          titleCSS: joi.optional(),
          subTitle: joi.optional(),
          subTitleCSS: joi.optional(),
        }),
      )
      .required(),
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
  bannerPostValidation,
  bannerPutValidation,
};
