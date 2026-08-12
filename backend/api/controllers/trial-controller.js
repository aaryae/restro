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

module.exports = {
  register,
  login,
  googleAuth,
  me,
  checkSlug,
  suggestSlug,
  createRestaurant,
};
