const joi = require("joi");
const httpStatus = require("http-status");
const isEmpty = require("../helpers/is-empty-helper");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { validateRequestBody } = require("../helpers/validator-helper");

const baseSchema = {
  name: joi.string().max(150),
  provider: joi.string().max(50).optional(),
  accountId: joi.number().integer().positive().allow(null).optional(),
  merchantId: joi.string().max(100),
  merchantCode: joi.string().max(100).allow("", null).optional(),
  merchantCategoryCode: joi.string().max(20).allow("", null).optional(),
  merchantName: joi.string().max(150),
  acquirerId: joi.string().max(50).allow("", null).optional(),
  merchantCity: joi.string().max(100).allow("", null).optional(),
  merchantPostalCode: joi.string().max(20).allow("", null).optional(),
  username: joi.string().max(150).allow("", null).optional(),
  npiUsername: joi.string().max(150).allow("", null).optional(),
  // Secrets — plaintext on the wire (over TLS); encrypted at rest server-side.
  password: joi.string().max(500).allow("", null).optional(),
  webhookToken: joi.string().max(2000).allow("", null).optional(),
  npiPrivateKey: joi.string().max(10000).allow("", null).optional(),
  enabled: joi.boolean().optional(),
  isActive: joi.boolean().optional(),
};

async function runValidation(req, res, next, joiModel) {
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
}

const createPaymentIntegrationValidation = async (req, res, next) => {
  const joiModel = joi.object({
    ...baseSchema,
    name: baseSchema.name.required(),
    merchantId: baseSchema.merchantId.required(),
    merchantName: baseSchema.merchantName.required(),
  });
  return runValidation(req, res, next, joiModel);
};

const updatePaymentIntegrationValidation = async (req, res, next) => {
  const joiModel = joi.object({
    ...baseSchema,
    name: baseSchema.name.optional(),
    merchantId: baseSchema.merchantId.optional(),
    merchantName: baseSchema.merchantName.optional(),
  });
  return runValidation(req, res, next, joiModel);
};

module.exports = {
  createPaymentIntegrationValidation,
  updatePaymentIntegrationValidation,
};
