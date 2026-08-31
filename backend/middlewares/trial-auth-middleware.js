"use strict";

const httpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { verifyTrialToken } = require("../helpers/jwt-helper");
const { trialUserModel } = require("../models");

async function trialAuthentication(req, res, next) {
  try {
    let token =
      req.headers.authorization ||
      req.headers["x-access-token"] ||
      req.headers.token ||
      "";

    if (typeof token !== "string" || !token.startsWith("Trial ")) {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Authentication failed: Invalid or missing Trial token.",
        null,
      );
    }

    const decoded = await verifyTrialToken(token.replace("Trial ", ""));
    const user = await trialUserModel.findByPk(decoded.id);
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

    if (user.passwordChangedAt && decoded.iat) {
      const changedMs = new Date(user.passwordChangedAt).getTime();
      if (decoded.iat * 1000 < changedMs - 2000) {
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

    req.trialUser = user;
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

module.exports = { trialAuthentication };
