const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const contactPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    full_name: joi.string().trim().min(2).required().label("Full Name"),
    email: joi.string().email().allow("", null).optional().label("Email"),
    phone: joi
      .string()
      .trim()
      .required()
      .custom((value, helpers) => {
        const digits = String(value).replace(/\D/g, "");
        const local = digits.startsWith("977") ? digits.slice(3) : digits;
        if (!/^9[6-8]\d{8}$/.test(local)) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.invalid": "Phone must be a valid Nepal mobile number",
        "any.required": "Phone is required",
      })
      .label("Phone"),
    cafe_name: joi.string().trim().min(2).required().label("Cafe Name"),
    subject: joi.string().trim().required().label("Subject"),
    message: joi.string().trim().required().label("Message"),
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
  contactPostValidation,
};
