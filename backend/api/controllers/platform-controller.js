"use strict";

const platformService = require("../services/platform-service");
const platformSmtpService = require("../services/platform-smtp-service");
const platformEmailTemplateService = require("../services/platform-email-template-service");
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

const wrap =
  (fn) =>
  async (req, res, next) => {
    try {
      return send(res, await fn(req));
    } catch (err) {
      logger.error(err);
      next(err);
    }
  };

module.exports = {
  login: wrap(platformService.login),
  me: wrap(platformService.me),
  updateMe: wrap(platformService.updateMe),
  changeMyPassword: wrap(platformService.changeMyPassword),
  uploadMyAvatar: wrap(platformService.uploadMyAvatar),
  stats: wrap(platformService.stats),
  statsTrends: wrap(platformService.statsTrends),
  listCafes: wrap(platformService.listCafes),
  getCafe: wrap(platformService.getCafe),
  createCafe: wrap(platformService.createCafe),
  activateCafe: wrap(platformService.activateCafe),
  suspendCafe: wrap(platformService.suspendCafe),
  extendTrial: wrap(platformService.extendTrial),
  impersonateCafe: wrap(platformService.impersonateCafe),
  listJobs: wrap(platformService.listJobs),
  listAuditLogs: wrap(platformService.listAuditLogs),
  listPlatformUsers: wrap(platformService.listPlatformUsers),
  createPlatformUser: wrap(platformService.createPlatformUser),
  updatePlatformUser: wrap(platformService.updatePlatformUser),
  deletePlatformUser: wrap(platformService.deletePlatformUser),
  getSmtp: wrap(platformSmtpService.getSmtp),
  upsertSmtp: wrap(platformSmtpService.upsertSmtp),
  listCafeEmailTemplates: wrap(
    platformEmailTemplateService.listCafeEmailTemplates,
  ),
  upsertCafeEmailTemplate: wrap(
    platformEmailTemplateService.upsertCafeEmailTemplate,
  ),
  resetCafeEmailTemplate: wrap(
    platformEmailTemplateService.resetCafeEmailTemplate,
  ),
};
