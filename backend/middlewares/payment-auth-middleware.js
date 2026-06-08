"use strict";

const HttpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const messageConstant = require("../constants/message-constant");
const { roleMenuActionModel, roleActionModel } = require("../models");

const CHECKOUT_ACTION_KEY = "order-checkout";
const SUPER_ADMIN_ROLE_ID = 1;

/**
 * Restrict QR payment APIs to users who can perform order checkout (cashier).
 * Reuses the existing order-checkout permission — no separate QR role required.
 */
const requireCheckoutPermission = async (req, res, next) => {
  try {
    if (!(req.user && req.user.id)) {
      return responseHelper.sendResponse(
        res,
        HttpStatus.UNAUTHORIZED,
        false,
        null,
        null,
        messageConstant.EN.USER_INFO_NOT_FOUND,
        null,
      );
    }

    if (req.user.roleId === SUPER_ADMIN_ROLE_ID) {
      return next();
    }

    const checkoutAction = await roleMenuActionModel.findOne({
      where: { key: CHECKOUT_ACTION_KEY, isDeleted: false },
      raw: true,
    });

    if (!checkoutAction) {
      return responseHelper.sendResponse(
        res,
        HttpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Checkout permission is not configured. Contact administrator.",
        null,
      );
    }

    const serverAccess = await roleActionModel.findOne({
      where: {
        roleId: req.user.roleId,
        roleMenuActionId: checkoutAction.id,
        isDeleted: false,
        requiredApproval: 0,
      },
      raw: true,
    });

    if (!serverAccess) {
      return responseHelper.sendResponse(
        res,
        HttpStatus.UNAUTHORIZED,
        false,
        null,
        null,
        messageConstant.EN.ACCESS_DENIED,
        null,
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireCheckoutPermission };
