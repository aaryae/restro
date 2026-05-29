const joi = require("joi");
const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const {
  validateRequestParams,
  validateRequestQuery,
} = require("../helpers/validator-helper");
const messageConstant = require("../constants/message-constant");
const isEmpty = require("../helpers/is-empty-helper");

const idValidation = async (req, res, next) => {
  let joiModel = joi.object({
    id: joi.number().required().label("id"),
  });
  const errors = await validateRequestParams(req, res, joiModel);
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

const slugValidation = async (req, res, next) => {
  let joiModel = joi.object({
    slug: joi
      .string()
      .custom((value, helpers) => {
        if (!isNaN(value)) {
          return helpers.error("any.invalid"); // Reject if it's a number
        }
        return value;
      })
      .label("slug"),
  });
  const errors = await validateRequestParams(req, res, joiModel);
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

const paginationValidation = async (req, res, next) => {
  let joiModel = joi.object({
    name: joi.string().optional().label("name"),
    userName: joi.string().optional().label("userName"),
    pan_vat_number: joi.number().optional().label("pan_vat_number"),
    address: joi.string().optional().label("address"),
    page: joi.number().optional().label("page"),
    limit: joi.number().optional().label("limit"),
    isDeleted: joi.boolean().optional().label("isDeleted"),
    mediaCategoryId: joi.number().optional().label("id"),
    title: joi.string().optional().label("title"),
    initials: joi.string().optional().label("initials"),
    username: joi.string().optional().label("username"),
    firstName: joi.string().allow("").optional().label("username"),
    email: joi.string().allow("").optional().label("email"),
    phone: joi.string().allow("").optional().label("phone"),
    status: joi.string().optional().label("status"),
    slug: joi.string().optional().label("slug"),
    departmentId: joi.number().optional().label("departmentId"),
    pageName: joi.string().optional().label("Page Name"),
    isRead: joi.boolean().optional().label("isRead"),
    templateName: joi.string().optional().label("templateName"),
    templateKey: joi.string().optional().label("templateKey"),
    category: joi.number().optional().label("Product Category"),
    isEmailedVerified: joi.boolean().optional().label("Is Email Verified"),
    userType: joi
      .string()
      .optional()
      .valid("guest", "customer")
      .label("User Type"),
    date: joi.string().optional().label("Date"),
    createdAt: joi.string().optional().label("Created At"),
    orderDate: joi.string().optional().label("Order Date"),
    isCombo: joi.string().optional().label("combo search"),
    // Revenue list specific filters
    start: joi.string().optional().label("start"),
    end: joi.string().optional().label("end"),
    supplierName: joi.string().optional().label("supplierName"),
    cash_or_credit: joi
      .string()
      .optional()
      .valid("cash", "credit")
      .label("cash_or_credit"),
    paymentMethod: joi
      .string()
      .optional()
      .valid("cash", "card", "online")
      .label("paymentMethod"),
    sort: joi.string().optional().valid("price", "latest").label("sort"),
    accountType: joi
      .string()
      .optional()
      .trim()
      .allow("")
      .custom((value, helpers) => {
        if (!value) return value;
        const validTypes = ["cash", "bank", "wallet"];
        const types = value.split(",").map((type) => type.trim());
        for (const type of types) {
          if (!validTypes.includes(type)) {
            return helpers.error("any.invalid", {
              message: `Invalid accountType: ${type}. Must be one of ${validTypes.join(", ")}`,
            });
          }
        }
        return value;
      }, "accountType validation"),
    contact_person: joi.string().optional().label("contact_person"),
    contact_number: joi.number().optional().label("contact_number"),
  });
  const errors = await validateRequestQuery(req, res, joiModel);
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
  idValidation,
  slugValidation,
  paginationValidation,
};
