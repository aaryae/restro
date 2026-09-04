const userService = require("../services/user-service");
const responseHelper = require("../../helpers/response-helper");
const httpStatus = require("http-status");
const logger = require("../../configs/logger");

const getTotalOfManyModel = async (req, res, next) => {
  try {
    const total = await userService.getTotalOfManyModel(req, res, next);
    if (total) {
      return responseHelper.sendResponse(
        res,
        total.status,
        total.success,
        total.data,
        total.errors,
        total.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Total not found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authLogin = async (req, res, next) => {
  try {
    const userLogin = await userService.userLogin(req, res, next);
    if (userLogin) {
      return responseHelper.sendResponse(
        res,
        userLogin.status,
        userLogin.success,
        userLogin.data,
        userLogin.errors,
        userLogin.message,
        userLogin.token,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authLogout = async (req, res, next) => {
  try {
    const userLogout = await userService.userLogout(req, res, next);
    if (userLogout) {
      return responseHelper.sendResponse(
        res,
        userLogout.status,
        userLogout.success,
        userLogout.data,
        userLogout.errors,
        userLogout.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authCreateUser = async (req, res, next) => {
  try {
    const createUser = await userService.createUser(req, res, next);
    if (createUser) {
      return responseHelper.sendResponse(
        res,
        createUser.status,
        createUser.success,
        createUser.data,
        createUser.errors,
        createUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Created",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authUpdateUser = async (req, res, next) => {
  try {
    const updateUser = await userService.updateUser(req, res, next);
    if (updateUser) {
      return responseHelper.sendResponse(
        res,
        updateUser.status,
        updateUser.success,
        updateUser.data,
        updateUser.errors,
        updateUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Updated",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authDeleteUser = async (req, res, next) => {
  try {
    const deleteUser = await userService.subDelete(req, res, next);
    if (deleteUser) {
      return responseHelper.sendResponse(
        res,
        deleteUser.status,
        deleteUser.success,
        deleteUser.data,
        deleteUser.errors,
        deleteUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Deleted",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authIsActiveUser = async (req, res, next) => {
  try {
    const user = await userService.toggleIsActive(req, res, next);
    if (user) {
      return responseHelper.sendResponse(
        res,
        user.status,
        user.success,
        user.data,
        user.errors,
        user.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Deleted",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authGetUser = async (req, res, next) => {
  try {
    const getUser = await userService.getOneUser(req, res, next);
    if (getUser) {
      return responseHelper.sendResponse(
        res,
        getUser.status,
        getUser.success,
        getUser.data,
        getUser.errors,
        getUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authGetProfile = async (req, res, next) => {
  try {
    const getUser = await userService.authGetProfile(req, res, next);
    if (getUser) {
      return responseHelper.sendResponse(
        res,
        getUser.status,
        getUser.success,
        getUser.data,
        getUser.errors,
        getUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authGetAccess = async (req, res, next) => {
  try {
    const access = await userService.getSessionAccess(req);
    return responseHelper.sendResponse(
      res,
      access.status,
      access.success,
      access.data,
      access.errors || null,
      access.message,
      null,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const getUser = await userService.updateProfile(req, res, next);
    if (getUser) {
      return responseHelper.sendResponse(
        res,
        getUser.status,
        getUser.success,
        getUser.data,
        getUser.errors,
        getUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authListUser = async (req, res, next) => {
  try {
    const listUser = await userService.getAllUsers(req, res, next);
    if (listUser) {
      return responseHelper.sendResponse(
        res,
        listUser.status,
        listUser.success,
        listUser.data,
        listUser.errors,
        listUser.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "User not Found",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const authChangePassword = async (req, res, next) => {
  try {
    const changePassword = await userService.changePassword(req, res, next);
    if (changePassword) {
      return responseHelper.sendResponse(
        res,
        changePassword.status,
        changePassword.success,
        changePassword.data,
        changePassword.errors,
        changePassword.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Password not Changed",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const resetPassword = await userService.resetPassword(req, res, next);
    if (resetPassword) {
      return responseHelper.sendResponse(
        res,
        resetPassword.status,
        resetPassword.success,
        resetPassword.data,
        resetPassword.errors,
        resetPassword.message,
        null,
      );
    } else {
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "Password not Reset",
        null,
      );
    }
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const posExchange = async (req, res, next) => {
  try {
    const { consumePosHandoff } = require("../../lib/pos-handoff");
    const code = String(req.body?.code || "").trim();
    if (!code) {
      return responseHelper.sendResponse(
        res,
        httpStatus.BAD_REQUEST,
        false,
        null,
        null,
        "Missing handoff code",
        null,
      );
    }

    const expectedSlug = req.tenant?.slug || req.body?.tenantSlug || null;
    const handoff = consumePosHandoff(code, expectedSlug);
    if (!handoff) {
      return responseHelper.sendResponse(
        res,
        httpStatus.UNAUTHORIZED,
        false,
        null,
        null,
        "Invalid or expired handoff code",
        null,
      );
    }

    return responseHelper.sendResponse(
      res,
      httpStatus.OK,
      true,
      {
        token: handoff.token,
        tenantSlug: handoff.tenantSlug,
        authHeader: `Admin ${handoff.token}`,
      },
      null,
      "POS session ready",
      null,
    );
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

module.exports = {
  authLogin,
  authListUser,
  authIsActiveUser,
  authGetProfile,
  authGetAccess,
  authLogout,
  authChangePassword,
  resetPassword,
  authCreateUser,
  authUpdateUser,
  authDeleteUser,
  authGetUser,
  updateProfile,
  getTotalOfManyModel,
  posExchange,
};
