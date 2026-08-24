"use strict";

const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { verifyPlatformToken } = require("../helpers/jwt-helper");
const { platformUserModel } = require("../models");
const { userHasPermission } = require("../constants/platform-rbac");

async function platformAuthentication(req, res, next) {
  try {
    let token =
      req.headers.authorization ||
      req.headers["x-access-token"] ||
      req.headers.token ||
      "";

    if (typeof token !== "string" || !token.startsWith("Platform ")) {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Authentication failed: Invalid or missing Platform token.",
        null,
      );
    }

    const decoded = await verifyPlatformToken(token.replace("Platform ", ""));
    if (decoded.typ && decoded.typ !== "platform") {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Invalid platform session.",
        null,
      );
    }

    const user = await platformUserModel.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "You're not authorized.",
        null,
      );
    }

    // Authorization uses DB permissions (not JWT alone).
    req.platformUser = user;
    return next();
  } catch (err) {
    return responseHelper.sendResponse(
      res,
      httpStatus.FORBIDDEN,
      false,
      null,
      null,
      "Session expired. Please sign in again.",
      null,
    );
  }
}

function requirePlatformPermission(...permissions) {
  return (req, res, next) => {
    const missing = permissions.filter(
      (perm) => !userHasPermission(req.platformUser, perm),
    );
    if (missing.length) {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "You do not have permission for this action.",
        null,
      );
    }
    return next();
  };
}

module.exports = {
  platformAuthentication,
  requirePlatformPermission,
};
