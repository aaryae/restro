const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const companySettingsPutValidation = async (req, res, next) => {
  let joiModel = joi.object({
    brand_name: joi.string().max(20).optional(),
    email: joi.string().email().optional(),
    primary_phone: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    secondary_phone: joi
      .string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
    fav_icon: joi.string().optional(),
    mapUrl: joi.string().optional().allow(null),
    brandingImage: joi.string().optional(),
    brandingFooterImage: joi.string().optional(),
    address: joi.string().max(50).optional(),
    footer_desc: joi.string().min(3).max(1000).optional(),
    google_analytics: joi.string().optional(),
    socials: joi
      .array()
      .items(
        joi.object({
          id: joi.number().optional(),
          social_title: joi.string().optional(),
          social_url: joi.string().optional(),
          fav_icon: joi.string().optional(),
        }),
      )
      .optional(),
    primaryColor: joi
      .string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .allow(null),
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

module.exports = { companySettingsPutValidation };
