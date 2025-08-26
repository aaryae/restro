const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const createOrderValidation = async (req, res, next) => {
  let joiModel = joi.object({
    orderType: joi.string().valid("dineIn", "takeaway", "delivery").required(),
    tableId: joi.number().integer().when("orderType", {
      is: "dineIn",
      then: joi.required(),
      otherwise: joi.optional(),
    }),
    customerId: joi.number().integer().optional(),
    customerName: joi.string().min(2).max(255).optional(),
    customerPhone: joi.string().min(10).max(20).optional(),
    customerEmail: joi.string().email().optional(),
    orderItems: joi
      .array()
      .items(
        joi.object({
          productId: joi.number().integer().required(),
          quantity: joi.number().integer().min(1).required(),
          specialInstructions: joi.string().allow("").max(500).optional(),
          departmentId: joi.number().integer().optional(),
        }),
      )
      .min(1)
      .required(),
    orderNote: joi.string().allow("").max(1000).optional(),
    estimatedTime: joi.number().integer().min(1).max(300).optional(),
    deliveryAddress: joi.string().max(500).when("orderType", {
      is: "delivery",
      then: joi.required(),
      otherwise: joi.optional(),
    }),
    paymentMethod: joi.string().valid("cash", "card", "online").optional(),
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

const addItemsToOrderValidation = async (req, res, next) => {
  let joiModel = joi.object({
    orderItems: joi
      .array()
      .items(
        joi.object({
          productId: joi.number().integer().required(),
          quantity: joi.number().integer().min(1).required(),
          specialInstructions: joi.string().max(500).optional(),
          departmentId: joi.number().integer().optional(),
        }),
      )
      .min(1)
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

const updateOrderStatusValidation = async (req, res, next) => {
  let joiModel = joi
    .object({
      status: joi
        .string()
        .valid(
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        )
        .optional(),
      paymentStatus: joi.string().valid("pending", "paid", "failed").optional(),
      paymentMethod: joi.string().valid("cash", "card", "online").optional(),
    })
    .min(1);

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

const updateOrderItemStatusValidation = async (req, res, next) => {
  let joiModel = joi.object({
    status: joi
      .string()
      .valid("pending", "preparing", "ready", "served")
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

const updateOrderItemsValidation = async (req, res, next) => {
  let joiModel = joi.object({
    items: joi
      .array()
      .items(
        joi.object({
          id: joi.number().integer().required(),
          quantity: joi.number().integer().min(1).optional(),
          status: joi
            .string()
            .valid("pending", "preparing", "ready", "served", "cancelled")
            .optional(),
        }),
      )
      .min(1)
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

const bulkServeOrderItemsValidation = async (req, res, next) => {
  let joiModel = joi.object({
    orderItemIds: joi.array().items(joi.number().integer()).min(1).required(),
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

const updateOrderItemsStatusValidation = async (req, res, next) => {
  let joiModel = joi.object({
    orderItemIds: joi.array().items(joi.number().integer()).min(1).required(),
    status: joi.string().valid("preparing", "ready").required(),
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

const checkoutOrderValidation = async (req, res, next) => {
  let joiModel = joi.object({
    customerId: joi.number().integer().optional(),
    customerDetails: joi
      .object({
        username: joi.string().min(2).max(255).required(),
        email: joi.string().email().optional(),
        phone: joi.string().min(10).max(20).optional(),
      })
      .optional(),
    paymentMethod: joi.string().valid("cash", "card", "online"),
    isGuestOrder: joi.boolean().optional(),
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
  createOrderValidation,
  addItemsToOrderValidation,
  updateOrderStatusValidation,
  updateOrderItemStatusValidation,
  updateOrderItemsValidation,
  bulkServeOrderItemsValidation,
  updateOrderItemsStatusValidation,
  checkoutOrderValidation,
};
