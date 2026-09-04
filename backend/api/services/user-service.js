const {
  roleActionModel,
  roleMenuActionModel,
  userModel,
  roleModel,
  // mediaModel,
  actionRequestModel,
  departmentModel,
  employeeModel,
  mediaModel,
  seoModel,
} = require("../../models");
const { Op } = require("sequelize");
const sequelize = require("../../models/index");
const {
  createSessionLog,
  findSingleUserLog,
  updateSessionLog,
} = require("../services/session-logs");
const generalConstant = require("../../constants/general-constant");
const passport = require("passport");
const responseHelper = require("../../helpers/response-helper");
const httpStatus = require("http-status");
const { hashPassword } = require("../../utils/bcrypt");
const {
  recordLoginFailure,
  clearLoginFailures,
  wrongPasswordMessage,
} = require("../../utils/loginRateLimit");
const paginate = require("../../utils/paginate");
const {
  comparePassword,
  generateJWT,
  POS_JWT_EXPIRY_SECONDS,
} = require("../../helpers/jwt-helper");
const { syncPrivilegedRoleAccess } = require("../../helpers/role-access-sync");
const internal = {};

const USER_PUBLIC_EXCLUDE = ["password"];

function toPublicUser(user) {
  if (!user) return null;
  const json = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
  delete json.password;
  if (json.supervisor) {
    const supervisor =
      typeof json.supervisor.toJSON === "function"
        ? json.supervisor.toJSON()
        : { ...json.supervisor };
    delete supervisor.password;
    json.supervisor = supervisor;
  }
  return json;
}

function assertAssignableRole(req, roleId) {
  const targetRoleId = Number(roleId);
  if (!targetRoleId) return null;
  // Only an existing Super Admin may assign Super Admin (roleId 1).
  if (targetRoleId === 1 && Number(req.user?.roleId) !== 1) {
    return {
      status: 403,
      success: false,
      message: "You cannot assign the Super Admin role",
      data: null,
    };
  }
  return null;
}

internal.userLoginPassport = (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate("user-login", (err, user, info) => {
      if (err) return reject(err);
      resolve({ user, info });
    })(req, res, next);
  });
};

const userLogin = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const loginId = String(req.body.username || "").trim();
    const isDeletedUser = await userModel.findOne({
      where: {
        isDeleted: false,
        [Op.or]: [
          { username: { [Op.iLike]: loginId } },
          { email: { [Op.iLike]: loginId } },
        ],
      },
    });

    if (isDeletedUser?.isDeleted === true) {
      returnData = {
        ...generalConstant.EN.USERS.USER_IS_DELETED,
        data: null,
      };
      return returnData;
    }
    if (isDeletedUser?.isActive === false) {
      returnData = {
        ...generalConstant.EN.USERS.USER_NOT_ACTIVE,
        data: null,
      };
      return returnData;
    }
    let loginData = await internal.userLoginPassport(req, res, next);
    console.log(loginData, "loginData");
    if (loginData.err) throw err;
    if (loginData && loginData.user) {
      const activeUserSession = await findSingleUserLog(loginData.user.id);
      if (activeUserSession && !activeUserSession.logout) {
        await updateSessionLog(loginData.user, req, res);
      }

      await createSessionLog(loginData.user, req);
      const sessionLog = await findSingleUserLog(loginData.user.id);
      const sessionToken = generateJWT(
        {
          id: loginData.user.id,
          email: loginData.user.email,
          roleId: loginData.user.roleId,
        },
        req.tenant,
        sessionLog?.id,
      );

      // Super Admin / Admin always receive every menu action (additive sync).
      // Fixes gaps when setup wasn't re-run or Super Admin role can't be edited in UI.
      await syncPrivilegedRoleAccess(loginData.user);

      let accessList = await roleActionModel.findAll({
        where: { roleId: loginData.user.roleId, isDeleted: false },
        attributes: ["roleMenuActionId", "requiredApproval"],
        raw: true,
        include: [
          {
            model: roleMenuActionModel,
            attributes: ["clientPath", "serverPath", "key", "list"],
          },
        ],
      });

      const clientAccess = accessList.map((x) => ({
        path: x["role_menu_action.clientPath"],
        key: x["role_menu_action.key"],
        list: x["role_menu_action.list"],
        requiredApproval: x["requiredApproval"],
      }));

      const serverAccess = accessList.map((x) => ({
        path: x["role_menu_action.serverPath"],
        key: x["role_menu_action.key"],
        requiredApproval: x["requiredApproval"],
      }));
      returnData = {
        ...generalConstant.EN.USERS.LOGIN_SUCCESS,
        data: {
          ...loginData.user,
          token: sessionToken,
          clientAccess: clientAccess,
          expiry: parseInt(
            new Date().getTime() / 1000 + POS_JWT_EXPIRY_SECONDS,
            10,
          ),
          serverAccess: serverAccess,
        },
      };
      clearLoginFailures(req);
    } else {
      recordLoginFailure(req);
      returnData = {
        ...generalConstant.EN.USERS.LOGIN_FAILURE,
        message: wrongPasswordMessage(req),
        data: null,
      };
    }
    console.log(returnData, "returnData");
    return returnData;
  } catch (err) {
    throw err;
  }
};

const userLogout = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };

    const userSession = await findSingleUserLog(+req.user.id);

    if (!userSession)
      return responseHelper.sendResponse(
        res,
        httpStatus.FORBIDDEN,
        false,
        null,
        null,
        "You're non authorized!",
        null,
      );

    await updateSessionLog(userSession, req, res);

    returnData = {
      ...generalConstant.EN.USERS.LOGOUT_SUCCESS,
    };

    return returnData;
  } catch (err) {
    throw err;
  }
};

const createUser = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    req.body.password = req.body.password.trim();
    req.body.password = await hashPassword(req.body.password);
    req.body.addedBy = +req.user.id;

    const {
      validateUsernameFormat,
      claimUsername,
    } = require("../../lib/global-username");

    const usernameCheck = validateUsernameFormat(req.body.username);
    if (!usernameCheck.ok) {
      return {
        status: 400,
        success: false,
        message: usernameCheck.message,
        data: null,
      };
    }
    req.body.username = usernameCheck.username;

    // Email is optional for staff accounts — username is the login id.
    if (req.body.email != null && String(req.body.email).trim() === "") {
      req.body.email = null;
    }

    // Check if username already exists in this cafe
    const existingUser = await userModel.findOne({
      where: { username: req.body.username, isDeleted: false },
    });

    if (existingUser) {
      return {
        ...generalConstant.EN.USERS.USER_NAME_EXISTS,
        data: null,
      };
    }

    try {
      await claimUsername(req.body.username, {
        source: "tenant",
        tenantId: req.tenant?.id || null,
      });
    } catch (err) {
      if (err.status === 409) {
        return {
          ...generalConstant.EN.USERS.USER_NAME_EXISTS,
          message: err.message,
          data: null,
        };
      }
      throw err;
    }

    //checking roleId
    if (req.body.roleId) {
      const roleDenied = assertAssignableRole(req, req.body.roleId);
      if (roleDenied) return roleDenied;

      const role = await roleModel.findOne({
        where: { id: +req.body.roleId, isDeleted: false },
        attributes: { exclude: ["updatedAt", "createdAt"] },
      });
      if (!role) {
        returnData = {
          ...generalConstant.EN.ROLES.ROLES_NOT_FOUND,
          data: null,
        };
        return returnData;
      }
    }

    //  this will for future use
    // if (req.body.supervisorId) {
    //   const supervisor = await userModel.findOne({
    //     where: { id: req.body.supervisorId, isDeleted: false },
    //     attributes: { exclude: ["updatedAt", "createdAt"] },
    //   });
    //   if (!supervisor) {
    //     returnData = {
    //       ...generalConstant.EN.USERS.User_NOT_FOUND,
    //       data: null,
    //     };
    //     return returnData;
    //   }
    // }

    req.body.supervisorId = 1;

    const user = await userModel.create(req.body);
    if (user) {
      returnData = {
        ...generalConstant.EN.USERS.CREATE_USER_SUCCESS,
        data: toPublicUser(user),
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.CREATE_USER_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const updateUser = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    req.body.updatedBy = +req.user.id;
    const isUserExist = await userModel.findOne({
      where: { id: +req.params.id },
    });
    if (!isUserExist) {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
      return returnData;
    }

    //checking roleId
    if (req.body.roleId) {
      const roleDenied = assertAssignableRole(req, req.body.roleId);
      if (roleDenied) return roleDenied;

      const role = await roleModel.findOne({
        where: { id: +req.body.roleId, isDeleted: false },
        attributes: { exclude: ["updatedAt", "createdAt"] },
      });
      if (!role) {
        returnData = {
          ...generalConstant.EN.ROLES.ROLES_NOT_FOUND,
          data: null,
        };
        return returnData;
      }
    }

    //checking supervisorId
    if (+req.body.supervisorId) {
      const supervisor = await userModel.findOne({
        where: { id: +req.body.supervisorId, isDeleted: false },
        attributes: { exclude: ["updatedAt", "createdAt"] },
      });
      if (!supervisor) {
        returnData = {
          ...generalConstant.EN.USERS.User_NOT_FOUND,
          data: null,
        };
        return returnData;
      }
    }

    const user = await isUserExist.update(req.body);

    if (user) {
      returnData = {
        ...generalConstant.EN.USERS.UPDATE_USER_SUCCESS,
        data: toPublicUser(user),
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.UPDATE_USER_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

// This is for toggling the isDeleted field of the user
const subDelete = async (req, res, next) => {
  try {
    const { isDeleted } = req.body;
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const isUserExist = await userModel.findOne({
      where: { id: +req.params.id },
    });
    if (!isUserExist) {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
      return returnData;
    }
    // Set imageUrl to null to enable media deletion when the user is soft deleted.
    const user = await isUserExist.update({ isDeleted, imageUrl: null });
    if (user) {
      user?.isDeleted === true
        ? (returnData = {
            ...generalConstant.EN.USERS.DELETE_USER_SUCCESS,
            data: toPublicUser(user),
          })
        : (returnData = {
            ...generalConstant.EN.USERS.UN_DELETE_USER_SUCCESS,
            data: toPublicUser(user),
          });
    } else {
      returnData = {
        ...generalConstant.EN.USERS.DELETE_USER_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};
const toggleIsActive = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const isUserExist = await userModel.findOne({
      where: { id: +req.params.id },
    });
    if (!isUserExist) {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
      return returnData;
    }
    const user = await isUserExist.update({ isActive });
    if (user) {
      user?.isActive === true
        ? (returnData = {
            ...generalConstant.EN.USERS.ACTIVE_USER_SUCCESS,
            data: toPublicUser(user),
          })
        : (returnData = {
            ...generalConstant.EN.USERS.UN_ACTIVE_USER_SUCCESS,
            data: toPublicUser(user),
          });
    } else {
      returnData = {
        ...generalConstant.EN.USERS.ACTIVE_USER_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const getOneUser = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const result = await userModel.findByPk(+req.params.id, {
      attributes: { exclude: USER_PUBLIC_EXCLUDE },
      include: {
        model: userModel,
        as: "supervisor",
        attributes: { exclude: USER_PUBLIC_EXCLUDE },
      },
    });
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.USER_FOUND,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const authGetProfile = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const result = await userModel.findOne({
      where: { id: +req.user.id },
      attributes: [
        "id",
        "username",
        "firstName",
        "lastName",
        "email",
        "gender",
        "imageUrl",
        "mobileNo",
        "roleId",
      ],
      include: [
        {
          model: userModel,
          as: "subordinates",
          attributes: ["id", "username"],
        },
      ],
    });
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.USER_FOUND,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

/** Menu permissions for an already-authenticated POS session (Serve bootstrap). */
const getSessionAccess = async (req) => {
  try {
    const user = await userModel.findOne({
      where: { id: +req.user.id, isDeleted: false },
      raw: true,
    });
    if (!user) {
      return {
        status: 404,
        success: false,
        message: "User not found",
        data: null,
      };
    }

    await syncPrivilegedRoleAccess(user);

    const role = await roleModel.findOne({
      where: { id: user.roleId },
      raw: true,
    });

    const accessList = await roleActionModel.findAll({
      where: { roleId: user.roleId, isDeleted: false },
      attributes: ["roleMenuActionId", "requiredApproval"],
      raw: true,
      include: [
        {
          model: roleMenuActionModel,
          attributes: ["clientPath", "serverPath", "key", "list"],
        },
      ],
    });

    const clientAccess = accessList.map((x) => ({
      path: x["role_menu_action.clientPath"],
      key: x["role_menu_action.key"],
      list: x["role_menu_action.list"],
      requiredApproval: x["requiredApproval"],
    }));

    const serverAccess = accessList.map((x) => ({
      path: x["role_menu_action.serverPath"],
      key: x["role_menu_action.key"],
      requiredApproval: x["requiredApproval"],
    }));

    const expiry = 24 * 60 * 60;

    return {
      status: 200,
      success: true,
      message: "Session access loaded",
      data: {
        id: user.id,
        username: user.username,
        roleId: user.roleId,
        roleType: role?.title || "User",
        clientAccess,
        serverAccess,
        expiry: parseInt(new Date().getTime() / 1000 + expiry, 10),
      },
    };
  } catch (err) {
    throw err;
  }
};

const updateProfile = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    req.body.updatedBy = +req.user.id;
    const user = await userModel.findOne({
      where: { id: +req.user.id },
    });
    if (!user) {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
      return returnData;
    }
    const result = await user.update(req.body);
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.UPDATE_USER_SUCCESS,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.UPDATE_USER_FAILURE,
        data: null,
      };
      return returnData;
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const { limit, page, isDeleted, username } = req.query;
    const filters = {};
    const include = [
      {
        model: roleModel,
        as: "roles",
        attributes: ["title"],
        where: {
          title: {
            [Op.ne]: "Super Admin",
          },
        },
        required: true,
      },
    ];
    const parseDeleted = isDeleted === "true";

    if (isDeleted) {
      filters.isDeleted = parseDeleted;
    }
    if (username) {
      filters.username = {
        [Op.iLike]: `%${username}%`,
      };
    }

    const result = await paginate(userModel, { limit, page, filters, include });
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.USER_LIST_SUCCESS,
        data: {
          ...result,
          data: Array.isArray(result.data)
            ? result.data.map((row) => toPublicUser(row))
            : result.data,
        },
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.USER_LIST_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const changePassword = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const { newPassword } = req.body;
    const user = await userModel.findOne({
      where: { id: +req.user.id },
    });
    if (!user) {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
      return returnData;
    }
    const isSameOldPassword = await comparePassword(newPassword, user.password);
    if (isSameOldPassword) {
      returnData = {
        ...generalConstant.EN.USERS.OLD_PASSWORD,
        data: null,
      };
      return returnData;
    }

    const password = await hashPassword(newPassword);
    const result = await user.update({ password });
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.PASSWORD_CHANGE_SUCCESS,
        data: toPublicUser(result),
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.PASSWORD_CHANGE_FAILURE,
        data: null,
      };
      return returnData;
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const resetPassword = async (req, res, next) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const { newPassword } = req.body;
    const user = await userModel.findOne({
      where: { id: +req.params.id },
    });
    if (!user) {
      returnData = {
        ...generalConstant.EN.USERS.User_NOT_FOUND,
        data: null,
      };
      return returnData;
    }
    const password = await hashPassword(newPassword);
    const result = await user.update({ password });
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.PASSWORD_RESET_SUCCESS,
        data: toPublicUser(result),
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.PASSWORD_RESET_FAILURE,
        data: null,
      };
      return returnData;
    }
    return returnData;
  } catch (err) {
    throw err;
  }
};

const getTotalOfManyModel = async () => {
  try {
    const countUser = await userModel.count({ where: { isDeleted: false } });
    const countRole = await roleModel.count({ where: { isDeleted: false } });
    const countMedia = await mediaModel.count({ where: { isDeleted: false } });
    const countSeo = await seoModel.count();
    const countDepartment = await departmentModel.count();
    const countEmployee = await employeeModel.count();

    return {
      ...generalConstant.EN.USERS.MODEL_COUNT_SUCCESS,
      data: {
        countUser,
        countRole,
        countMedia,
        countSeo,
        countDepartment,
        countEmployee,
      },
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  userLogin,
  toggleIsActive,
  authGetProfile,
  getSessionAccess,
  userLogout,
  createUser,
  updateUser,
  subDelete,
  getAllUsers,
  getOneUser,
  changePassword,
  updateProfile,
  resetPassword,
  getTotalOfManyModel,
};
