"use strict";
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
        name: joi.string().min(2).max(255).optional(),
        email: joi.string().email().optional(),
        mobileNo: joi.string().min(10).max(20).optional(),
        phone: joi.string().min(10).max(20).optional(),
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
          .xor("productId", "openItemId"),
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
    orderNote: joi.string().allow("", null).optional(),
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
  const joiModel = joi.object({
    orderItems: joi
      .array()
      .items(
        joi
          .object({
            id: joi.number().positive(),
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
          .xor("productId", "openItemId"),
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
    orderNote: joi.string().allow("", null).optional(),
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
    orderItemIds: joi.number().positive().required(),
    status: joi
      .string()
      .valid(
        "pending",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
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

const checkoutOrderValidation = async (req, res, next) => {
  let joiModel = joi
    .object({
      orderId: joi.number().integer().positive().optional().messages({
        "number.base": "Order ID must be a number",
        "number.integer": "Order ID must be an integer",
        "number.positive": "Order ID must be positive",
      }),
      checkoutAll: joi.boolean().default(false).messages({
        "boolean.base": "Checkout all must be a boolean",
      }),
      orderItemIds: joi
        .array()
        .items(joi.number().integer().positive())
        .optional()
        .when("paymentSources", {
          is: joi.exist(),
          then: joi.forbidden().messages({
            "any.unknown": "orderItemIds is not allowed with paymentSources",
          }),
        })
        .messages({
          "array.base": "Order item IDs must be an array",
          "number.base": "Each order item ID must be a number",
          "number.integer": "Each order item ID must be an integer",
          "number.positive": "Each order item ID must be positive",
        }),
      customerId: joi.number().integer().positive().optional().messages({
        "number.base": "Customer ID must be a number",
        "number.integer": "Customer ID must be an integer",
        "number.positive": "Customer ID must be positive",
      }),
      customerDetails: joi
        .object({
          firstName: joi.string().min(2).max(255).optional().messages({
            "string.min": "First name must be at least 2 characters",
            "string.max": "First name cannot exceed 255 characters",
          }),
          lastName: joi.string().min(2).max(255).optional().messages({
            "string.min": "Last name must be at least 2 characters",
            "string.max": "Last name cannot exceed 255 characters",
          }),
          name: joi.string().min(2).max(255).optional().messages({
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name cannot exceed 255 characters",
          }),
          email: joi.string().email().optional().messages({
            "string.email": "Email must be a valid email address",
          }),
          mobileNo: joi.string().min(10).max(20).optional().messages({
            "string.min": "Mobile number must be at least 10 characters",
            "string.max": "Mobile number cannot exceed 20 characters",
          }),
          phone: joi.string().min(10).max(20).optional().messages({
            "string.min": "Phone number must be at least 10 characters",
            "string.max": "Phone number cannot exceed 20 characters",
          }),
        })
        .optional()
        .messages({
          "object.base": "Customer details must be an object",
        }),
      sessionId: joi.string().uuid().optional().messages({
        "string.uuid": "Session ID must be a valid UUID",
      }),
      isGuestOrder: joi.boolean().default(false).messages({
        "boolean.base": "Is guest order must be a boolean",
      }),
      paymentSources: joi
        .array()
        .items(
          joi.object({
            paymentMethod: joi
              .string()
              .valid("cash", "card", "online", "cheque")
              .required()
              .messages({
                "any.required": "Payment method is required for payment source",
                "string.base": "Payment method must be a string",
                "any.only":
                  "Payment method must be one of: cash, card, online, cheque",
              }),
            amount: joi.number().positive().precision(2).required().messages({
              "any.required": "Amount is required for payment source",
              "number.base": "Amount must be a number",
              "number.positive": "Amount must be positive",
              "number.precision": "Amount must have at most 2 decimal places",
            }),
            cashOrCredit: joi
              .string()
              .valid("cash", "credit")
              .default("cash")
              .messages({
                "string.base": "Cash or credit must be a string",
                "any.only": "Cash or credit must be one of: cash, credit",
              }),
            accountId: joi.number().integer().positive().optional().messages({
              "number.base": "Account ID must be a number",
              "number.integer": "Account ID must be an integer",
              "number.positive": "Account ID must be positive",
            }),
            remarks: joi.string().optional().messages({
              "string.base": "Remarks must be a string",
            }),
          }),
        )
        .optional()
        .messages({
          "array.base": "Payment sources must be an array",
        }),
      paymentMethod: joi
        .string()
        .valid("cash", "card", "online", "cheque")
        .optional()
        .messages({
          "string.base": "Payment method must be a string",
          "any.only":
            "Payment method must be one of: cash, card, online, cheque",
        }),
      cashOrCredit: joi
        .string()
        .valid("cash", "credit")
        .default("cash")
        .messages({
          "string.base": "Cash or credit must be a string",
          "any.only": "Cash or credit must be one of: cash, credit",
        }),
      remarks: joi.string().optional().messages({
        "string.base": "Remarks must be a string",
      }),
      takeAwayName: joi
        .string()
        .max(255)
        .when("isGuestOrder", {
          is: true,
          then: joi.required().messages({
            "any.required":
              "Takeaway name is required for guest takeaway orders",
            "string.empty": "Takeaway name cannot be empty",
            "string.base": "Takeaway name must be a string",
            "string.max": "Takeaway name cannot be longer than 255 characters",
          }),
          otherwise: joi.optional(),
        }),
    })
    .oxor("paymentSources", "paymentMethod")
    .messages({
      "object.oxor":
        "Either paymentSources or paymentMethod must be provided, but not both",
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
