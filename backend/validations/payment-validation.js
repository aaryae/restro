const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const initiateQrValidation = async (req, res, next) => {
  const joiModel = joi.object({
    checkoutAll: joi.boolean().optional(),
    // For table checkout-all, tableId is required and orderId is optional;
    // for single-order checkout, orderId is required.
    orderId: joi.when("checkoutAll", {
      is: true,
      then: joi.number().integer().positive().optional(),
      otherwise: joi.number().integer().positive().required(),
    }),
    tableId: joi.when("checkoutAll", {
      is: true,
      then: joi.number().integer().positive().required(),
      otherwise: joi.number().integer().positive().optional(),
    }),
    amount: joi.number().precision(2).positive().optional(),
    accountId: joi.number().integer().positive().optional(),
    remarks: joi.string().max(255).optional(),
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

module.exports = { initiateQrValidation };
