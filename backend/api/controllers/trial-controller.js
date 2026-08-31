"use strict";

const trialService = require("../services/trial-service");
const responseHelper = require("../../helpers/response-helper");
const logger = require("../../configs/logger");

const send = (res, result) =>
  responseHelper.sendResponse(
    res,
    result.status,
    result.success,
    result.data,
    result.errors || null,
    result.message,
    result.token || null,
  );

const register = async (req, res, next) => {
  try {
    return send(res, await trialService.register(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    return send(res, await trialService.login(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    return send(res, await trialService.verifyOtp(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    return send(res, await trialService.resendOtp(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    return send(res, await trialService.forgotPassword(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    return send(res, await trialService.resetPassword(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const checkUsername = async (req, res, next) => {
  try {
    return send(res, await trialService.checkUsername(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    return send(res, await trialService.googleAuth(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    return send(res, await trialService.me(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const checkSlug = async (req, res, next) => {
  try {
    return send(res, await trialService.checkSlug(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const suggestSlug = async (req, res, next) => {
  try {
    return send(res, await trialService.suggestRestaurantSlug(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const createRestaurant = async (req, res, next) => {
  try {
    return send(res, await trialService.createRestaurant(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const posBootstrap = async (req, res, next) => {
  try {
    return send(res, await trialService.posBootstrap(req));
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  checkUsername,
  googleAuth,
  me,
  checkSlug,
  suggestSlug,
  createRestaurant,
  posBootstrap,
};
