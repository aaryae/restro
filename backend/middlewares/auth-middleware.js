"use strict";
const { verifyToken } = require("../helpers/jwt-helper");
const HttpStatus = require("http-status");
const responseHelper = require("../helpers/response-helper");
const { EN } = require("../constants/message-constant");
const {
  roleMenuActionModel,
  roleActionModel,
  actionRequestModel,
  userModel,
} = require("../models/index");
const { findSingleUserLog } = require("../api/services/session-logs");
const httpStatus = require("http-status");
const { sendNotification } = require("../helpers/send-notification");
const messageConstant = require("../constants/message-constant");
const { sendMail } = require("../utils/mailer");
const authMiddleware = {};

authMiddleware.authentication = async (req, res, next) => {
  try {
    let token =
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"] ||
      req.headers.authorization ||
      req.headers.token;
    if (token && token.length) {
      if (!token.startsWith("Admin")) {
        return responseHelper.sendResponse(
          res,
          httpStatus.FORBIDDEN,
          false,
          null,
          null,
          "Authentication failed: Invalid or malformed token!",
          null,
        );
      }
      token = token.replace("Admin ", "");
      const d = await verifyToken(token);
      if (d && d.id) {
        const isSession = await findSingleUserLog(d.id);
        if (!isSession)
          return responseHelper.sendResponse(
            res,
            httpStatus.FORBIDDEN,
            false,
            null,
            null,
            "You're non authorized!",
            null,
          );

        req.user = d;
        req.headers.dbName = req.headers.dbName || "main_accounting";
        return next();
      } else {
        return responseHelper.sendResponse(
          res,
          HttpStatus.FORBIDDEN,
          false,
          null,
          null,
          EN.SESSION_EXPIRED,
          null,
        );
      }
    }
    return responseHelper.sendResponse(
      res,
      HttpStatus.FORBIDDEN,
      false,
      null,
      token,
      messageConstant.EN.TOKEN_NOT_FOUND,
      null,
    );
  } catch (err) {
    return responseHelper.sendResponse(
      res,
      HttpStatus.FORBIDDEN,
      false,
      null,
      null,
      EN.TOKEN_EXPIRED,
      null,
    );
  }
};
authMiddleware.byPassAuthentication_main = async (req, res, next) => {
  try {
    let token =
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"] ||
      req.headers.authorization ||
      req.headers.token;
    if (token && token.length) {
      token = token.replace("Admin ", "");
      const d = await verifyToken(token);
      if (d && d.id) {
        req.user = d;
      }
    }
    return next();
  } catch (err) {
    return responseHelper.sendResponse(
      res,
      HttpStatus.FORBIDDEN,
      false,
      null,
      null,
      messageConstant.EN.TOKEN_EXPIRED,
      null,
    );
  }
};
authMiddleware.authenticationForLogout = async (req, res, next) => {
  try {
    let token =
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"] ||
      req.headers.authorization ||
      req.headers.token;
    if (token && token.length) {
      token = token.replace("Admin ", "");
      req.user = await verifyToken(token);
      return next();
    }
    return responseHelper.sendResponse(
      res,
      HttpStatus.FORBIDDEN,
      false,
      null,
      token,
      messageConstant.EN.TOKEN_NOT_FOUND,
      null,
    );
  } catch (err) {
    return next(err);
  }
};

authMiddleware.authorization = async (req, res, next) => {
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

    let serverPath = req.baseUrl + req.route.path;
    if (serverPath.substr(serverPath.length - 1) === "/") {
      serverPath = serverPath.slice(0, serverPath.length - 1);
    }
    serverPath = serverPath.replace(/^\/api\/v\d+\//, "/");
    const requestMethod = req.method;

    let access = await roleMenuActionModel?.findOne({
      where: { isDeleted: false, requestMethod, serverPath },
      raw: true,
    });

    if (access && access.id) {
      let serverAccess = await roleActionModel?.findOne({
        where: {
          roleId: req.user.roleId,
          roleMenuActionId: access.id,
          isDeleted: false,
        },
        raw: true,
      });

      const isSuperAdmin = req.user.roleId === 1;

      // Super Admin always has full API access (role grants can lag behind setup.json).
      if (isSuperAdmin) {
        return next();
      }

      if (serverAccess && serverAccess.requiredApproval === 1) {
        const result = await actionRequestModel.create({
          userId: req.user.id,
          requestedAction: requestMethod,
          endpoint: serverPath,
          method: requestMethod,
          status: "Pending",
          requestBody: req.body,
          params: req.params,
          query: req.query,
        });

        if (result) {
          const user = await userModel.findByPk(result.userId, {
            include: {
              model: userModel,
              as: "supervisor",
            },
          });
          if (!user) {
            return responseHelper.sendResponse(
              res,
              HttpStatus.NOT_FOUND,
              false,
              null,
              null,
              "User Not Found",
              null,
            );
          }
          await sendNotification(
            user.username,
            user?.supervisorId,
            user?.id,
            EN.APPROVAL_REQUEST,
            "Approval_Request",
            result?.id,
          );
          //email notification
          const placeholders = {
            name: user?.supervisor?.username,
            senderUserName: user.username,
            requestId: result.id.toString(),
            email: user.email,
            supervisorId: user.supervisorId,
          };

          //    desc:"This template will be use when user send approval request for new changes",
          sendMail(
            "requestForApproval",
            placeholders,
            user?.supervisor?.email,
          ).catch((error) => {
            // Log the error without throwing it further
            console.error("Mail sending error:", error);
          });
          return responseHelper.sendResponse(
            res,
            200,
            true,
            result,
            null,
            "Request sent for approval",
          );
        }
      }

      if (serverAccess && serverAccess.requiredApproval === 0) {
        return next();
      } else {
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
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

authMiddleware.authorizationByPass = async (req, res, next) => {
  try {
    let token =
      req.body.token ||
      req.query.token ||
      req.headers["x-access-token"] ||
      req.headers.authorization ||
      req.headers.token;
    if (token && token.length) {
      token = token.replace("Admin ", "");
      const decodedData = await verifyToken(token);
      if (decodedData) {
        req.user = decodedData;
        req.is_guest = false;
        return next();
      } else {
        req.is_guest = true;
        return next();
      }
    }
    return next();
  } catch (err) {
    req.is_guest = true;
    return next(err);
  }
};

module.exports = authMiddleware;
