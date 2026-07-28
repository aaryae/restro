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
          "any.required": "Please select a table for dine-in orders",
          "number.base": "Please select a table for dine-in orders",
        }),
        // Optional for takeaway so a dine-in customer can add a takeaway
        // order that still stays on the same table/session.
        otherwise: joi.optional(),
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
      paymentStatus: joi
        .string()
        .valid("pending", "paid", "failed", "partially_paid")
        .optional(),
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
          "any.required": "Please select a table for dine-in orders",
          "number.base": "Please select a table for dine-in orders",
        }),
        otherwise: joi.optional(),
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
  const paymentLineSchema = joi
    .object({
      paymentMethod: joi.string().valid("cash", "card", "online").required(),
      amount: joi.number().positive().required(),
      accountId: joi.number().positive().required(),
    })
    .unknown(false);

  const paymentsArraySchema = joi
    .array()
    .items(paymentLineSchema)
    .min(1)
    .required();

  // Split across the whole table session
  const paymentSplitCheckoutAllSchema = joi
    .object({
      checkoutAll: joi.valid(true).required(),
      payments: paymentsArraySchema,
      customerId: joi.number().positive().optional(),
      sessionId: joi.string().uuid({ version: "uuidv4" }).optional(),
      discountAmount: joi.number().min(0).optional(),
    })
    .required()
    .unknown(false);

  // Split for a single order (takeaway / one order on a table)
  const paymentSplitOrderSchema = joi
    .object({
      orderId: joi.number().positive().required(),
      payments: paymentsArraySchema,
      customerId: joi.number().positive().optional(),
      discountAmount: joi.number().min(0).optional(),
    })
    .required()
    .unknown(false);

  // Split for selected line items (partial table checkout)
  const paymentSplitSelectiveSchema = joi
    .object({
      orderItemIds: joi
        .array()
        .items(joi.number().positive())
        .min(1)
        .required(),
      payments: paymentsArraySchema,
      customerId: joi.number().positive().optional(),
      discountAmount: joi.number().min(0).optional(),
    })
    .required()
    .unknown(false);

  const checkoutAllSchema = joi
    .object({
      checkoutAll: joi.valid(true).required(),
      sessionId: joi.string().uuid({ version: "uuidv4" }).required(),
      paymentMethod: joi.string().valid("cash", "card", "online").required(),
      cashOrCredit: joi.string().valid("cash", "credit").required(),
      customerId: joi.number().positive().optional(),
      accountId: joi.number().positive().optional(),
    })
    .required()
    .unknown(false);

  const takeawayCheckoutSchema = joi
    .object({
      orderId: joi.number().positive().required(),
      paymentMethod: joi.string().valid("cash", "card", "online").required(),
      customerId: joi.number().positive().optional(),
      accountId: joi.number().positive().optional(),
    })
    .required()
    .unknown(false);

  const selectiveCheckoutSchema = joi
    .object({
      orderItemIds: joi
        .array()
        .items(joi.number().positive())
        .min(1)
        .required(),
      paymentMethod: joi.string().valid("cash", "card", "online").required(),
      customerId: joi.number().positive().optional(),
      accountId: joi.number().positive().optional(),
    })
    .required()
    .unknown(false);

  const joiModel = joi
    .alternatives()
    .try(
      paymentSplitCheckoutAllSchema,
      paymentSplitOrderSchema,
      paymentSplitSelectiveSchema,
      checkoutAllSchema,
      takeawayCheckoutSchema,
      selectiveCheckoutSchema,
    )
    .messages({
      "alternatives.match":
        "Invalid payload — must match one of the valid checkout types.",
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
