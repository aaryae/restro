const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const { validateRequestBody } = require("../helpers/validator-helper");

const createOrderValidation = async (req, res, next) => {
  let joiModel = joi.object({
    orderType: joi.string().valid("dineIn", "takeaway").required().messages({
      "any.required": "Order type is required",
      "string.base": "Order type must be a string",
      "any.only": "Order type must be one of: dineIn, takeaway",
    }),
    tableId: joi
      .number()
      .integer()
      .when("orderType", {
        is: "dineIn",
        then: joi.required().messages({
          "any.required": "Table ID is required for dine-in orders",
          "number.base": "Table ID must be a number",
        }),
        otherwise: joi.forbidden(),
      }),
    customerDetails: joi
      .object({
        firstName: joi.string().min(2).max(255).optional(),
        lastName: joi.string().min(2).max(255).optional(),
        name: joi.string().min(2).max(255).optional(), // Alias for flexibility based on samples
        email: joi.string().email().optional(),
        mobileNo: joi.string().min(10).max(20).optional(),
        phone: joi.string().min(10).max(20).optional(), // Alias for flexibility
      })
      .optional(),
    orderItems: joi
      .array()
      .items(
        joi
          .object({
            quantity: joi.number().integer().min(1).required(),
            specialInstructions: joi.string().allow("").max(500).optional(),
            departmentId: joi.number().integer().required(),
            discount: joi.number().min(0).optional(),
            discountPercentage: joi.number().min(0).max(100).optional(),
            addons: joi
              .array()
              .items(
                joi.object({
                  addonId: joi.number().integer().required(),
                  quantity: joi.number().integer().min(1).required(),
                  specialInstructions: joi
                    .string()
                    .allow("")
                    .max(500)
                    .optional(),
                }),
              )
              .optional(),
            productId: joi.number().integer(),
            openItemId: joi.number().integer(),
          })
          .xor("productId", "openItemId"), // Ensure exactly one of productId or openItemId
      )
      .min(1)
      .required()
      .messages({
        "array.min": "Order must contain at least one item",
        "object.xor":
          "Each order item must specify exactly one of productId or openItemId",
      }),
    takeAwayName: joi
      .string()
      .max(255)
      .when("orderType", {
        is: "takeaway",
        then: joi.required().messages({
          "any.required": "Takeaway name is required for takeaway orders",
          "string.empty": "Takeaway name cannot be empty",
          "string.base": "Takeaway name must be a string",
          "string.max": "Takeaway name cannot be longer than 255 characters",
        }),
        otherwise: joi.forbidden(),
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
          "prepared",
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
