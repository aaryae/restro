"use strict";

const cafeTrialService = require("../services/cafe-trial-service");

function send(res, result) {
  const status = result.status || (result.success === false ? 400 : 200);
  return res.status(status).json({
    success: result.success !== false,
    msg: result.message || result.msg || null,
    message: result.message || result.msg || null,
    data: result.data ?? null,
    status,
  });
}

const getTrialStatus = async (req, res, next) => {
  try {
    return send(res, await cafeTrialService.getTrialStatus(req));
  } catch (err) {
    return next(err);
  }
};

const selfExtendTrial = async (req, res, next) => {
  try {
    return send(res, await cafeTrialService.selfExtendTrial(req));
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getTrialStatus,
  selfExtendTrial,
};
