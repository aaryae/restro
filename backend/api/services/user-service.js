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
const paginate = require("../../utils/paginate");
const { comparePassword } = require("../../helpers/jwt-helper");
const internal = {};

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
    const isDeletedUser = await userModel.findOne({
      where: { username: req.body.username, isDeleted: false },
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
      const expiry = 24 * 60 * 60;
      returnData = {
        ...generalConstant.EN.USERS.LOGIN_SUCCESS,
        data: {
          ...loginData.user,
          clientAccess: clientAccess,
          expiry: parseInt(new Date().getTime() / 1000 + expiry, 10),
          serverAccess: serverAccess,
        },
      };
    } else {
      returnData = {
        ...generalConstant.EN.USERS.LOGIN_FAILURE,
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

    // Check if username already exists
    const existingUser = await userModel.findOne({
      where: { username: req.body.username, isDeleted: false },
    });

    if (existingUser) {
      return {
        ...generalConstant.EN.USERS.USER_NAME_EXISTS,
        data: null,
      };
    }

    //checking roleId
    if (req.body.roleId) {
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
        data: user,
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
        data: user,
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
            data: user,
          })
        : (returnData = {
            ...generalConstant.EN.USERS.UN_DELETE_USER_SUCCESS,
            data: user,
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
            data: user,
          })
        : (returnData = {
            ...generalConstant.EN.USERS.UN_ACTIVE_USER_SUCCESS,
            data: user,
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
      include: {
        model: userModel,
        as: "supervisor",
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
    console.log(req.user.id, "req.user.id");
    const result = await userModel.findOne({
      where: { id: +req.user.id },
      include: [
        {
          model: userModel,
          as: "subordinates",
          attributes: ["username", "email"],
          include: [
            {
              model: actionRequestModel,
              as: "actionRequests",
            },
          ],
        },
      ],
    });
    console.log(result, "result");
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
        [Op.like]: `%${username}%`,
      };
    }

    const result = await paginate(userModel, { limit, page, filters, include });
    if (result) {
      returnData = {
        ...generalConstant.EN.USERS.USER_LIST_SUCCESS,
        data: result,
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
        data: result,
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
        data: result,
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
