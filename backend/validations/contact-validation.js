const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const contactPostValidation = async (req, res, next) => {
  let joiModel = joi.object({
    full_name: joi.string().required().label("Full Name"),
    email: joi.string().email().required().label("Email"),
    subject: joi.string().required().label("Subject"),
    message: joi.string().required().label("Message"),
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
