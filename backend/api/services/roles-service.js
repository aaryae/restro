const {
  roleModel,
  roleActionModel,
  sequelize,
  userModel,
  roleMenuActionModel,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");

const paginate = require("../../utils/paginate");
const { Op } = require("sequelize");
const { normalizeRoleActionIds } = require("../../helpers/permissionDependencies");
const { PRIVILEGED_ROLE_TITLES } = require("../../helpers/role-access-sync");

function isPrivilegedRoleTitle(title) {
  const normalized = String(title || "")
    .trim()
    .toLowerCase();
  return PRIVILEGED_ROLE_TITLES.some(
    (privileged) => privileged.toLowerCase() === normalized,
  );
}

function isCallerSuperAdmin(req) {
  return Number(req.user?.roleId) === 1;
}

const createRole = async (req, roleDataPost) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const title = String(roleDataPost.title || "").trim();
    if (isPrivilegedRoleTitle(title)) {
      return {
        status: 403,
        success: false,
        message: `Cannot create a role named "${title}"`,
        data: null,
      };
    }
    let rolesData = {
      title,
      description: roleDataPost.description,
      role_type: roleDataPost.role_type,
    };
    const roles = await roleModel.create(rolesData);
    if (roles) {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_SAVE_SUCCESS,
        data: roles,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_SAVE_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const findAllRoles = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    let { limit, page, title } = req.query;
    const excludedTitles = isCallerSuperAdmin(req)
      ? ["Super Admin"]
      : [...PRIVILEGED_ROLE_TITLES];

    const filters = {
      isDeleted: false,
      isActive: true,
      title: {
        [Op.notIn]: excludedTitles,
      },
    };
    const include = [];

    if (title) {
      filters.title = {
        [Op.and]: [
          { [Op.iLike]: `%${title}%` },
          { [Op.notIn]: excludedTitles },
        ],
      };
      page = 1;
    }

    const result = await paginate(roleModel, { limit, page, filters, include });
    if (result) {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_LIST_SUCCESS,
        data: result,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_LIST_FAILURE,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const findSingleRole = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const roleId = +req.params.id;
    const role = await roleModel.findOne({
      where: { id: roleId, isDeleted: false },
      attributes: { exclude: ["updatedAt", "createdAt"] },
      include: [
        {
          model: roleActionModel,
          attributes: ["roleMenuActionId", "requiredApproval"],
          include: [
            {
              model: roleMenuActionModel,
              // attributes: ["title"],
            },
          ],
        },
      ],
      // raw: true,
    });
    if (role && role.id) {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_VIEW_SUCCESS,
        data: role,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_NOT_FOUND,
        data: null,
      };
    }
    return returnData;
  } catch (error) {
    throw error;
  }
};

const editSingleRole = async (req) => {
  let returnData = { ...generalConstant.EN.SERVER_ERROR };
  const transaction = await sequelize.transaction();
  try {
    const roleId = +req.params.id;
    const callerIsSuperAdmin = isCallerSuperAdmin(req);

    // Validate the existence of the role
    const role = await roleModel.findOne({
      where: { id: roleId, isDeleted: false },
      transaction,
    });

    if (!role) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.ROLES.ROLES_NOT_FOUND,
        data: null,
      };
    }

    // Super Admin role is never editable; Admin role only by Super Admin.
    if (roleId === 1 || (isPrivilegedRoleTitle(role.title) && !callerIsSuperAdmin)) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.ROLES.SUPERADMIN_CANNOT_UPDATE,
        data: null,
      };
    }

    const nextTitle =
      req.body.title != null ? String(req.body.title).trim() : role.title;
    if (isPrivilegedRoleTitle(nextTitle) && nextTitle !== role.title) {
      await transaction.rollback();
      return {
        status: 403,
        success: false,
        message: `Cannot rename a role to "${nextTitle}"`,
        data: null,
      };
    }

    // Update the role details
    await roleModel.update(
      {
        title: req.body.title,
        description: req.body.description,
        isActive: req.body.isActive,
        roleType: req.body.roleType,
      },
      { where: { id: roleId }, transaction },
    );

    // If role actions are provided, handle them
    if (req.body.role_actions?.length > 0) {
      const allRoleMenuActions = await roleMenuActionModel.findAll({
        where: { isDeleted: false },
        attributes: ["id", "key", "list"],
        raw: true,
        transaction,
      });

      const requestedIds = req.body.role_actions.map(
        (action) => +action.roleMenuActionId,
      );
      let normalizedIds = normalizeRoleActionIds(
        allRoleMenuActions,
        requestedIds,
      );

      // Non–Super Admins may only grant permissions they themselves hold.
      if (!callerIsSuperAdmin) {
        const callerGrants = await roleActionModel.findAll({
          where: {
            roleId: Number(req.user.roleId),
            isDeleted: false,
          },
          attributes: ["roleMenuActionId"],
          raw: true,
          transaction,
        });
        const allowed = new Set(
          callerGrants.map((row) => Number(row.roleMenuActionId)),
        );
        normalizedIds = normalizedIds.filter((id) => allowed.has(Number(id)));
      }

      if (normalizedIds.length === 0) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Select at least one permission you are allowed to grant",
          data: null,
        };
      }

      // Delete existing role actions
      await roleActionModel.destroy({
        where: { roleId },
        transaction,
      });
      // Create new role actions
      const roleActions = normalizedIds.map((roleMenuActionId) => ({
        roleId,
        roleMenuActionId,
        requiredApproval: false,
        createdBy: req.user.id,
      }));

      const result = await roleActionModel.bulkCreate(roleActions, {
        transaction,
      });

      // Set the success data
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_EDIT_SUCCESS,
        data: result,
      };
    } else {
      // No role actions provided
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_EDIT_FAILURE,
        data: role,
      };
    }

    // Commit transaction
    await transaction.commit();
    return returnData;
  } catch (error) {
    // Rollback transaction on error
    if (transaction) await transaction.rollback();
    console.error("Error updating role:", error);
    throw error;
  }
};

const deleteSingleRole = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    const roleId = +req.params.id;

    // Check if the role exists and is not deleted
    const role = await roleModel.findOne({
      where: { id: roleId, isDeleted: false },
    });

    if (!role) {
      return {
        ...generalConstant.EN.ROLES.ROLES_NOT_FOUND,
        data: null,
      };
    }

    //things to do later alter roleAction add onDelete cascade

    // Check if role is used in roleActionModel
    // const isRoleInUsed = await roleActionModel.findOne({
    //   where: { roleId: roleId },
    // });
    // Check if role is assigned to an active (not deleted) user
    const isRoleUsedInUser = await userModel.findOne({
      where: { roleId: roleId, isDeleted: false },
    });

    if (isRoleUsedInUser) {
      return {
        ...generalConstant.EN.ROLES.ROLES_IS_IN_USE,
        data: null,
      };
    }

    // Delete the role
    const deletedRole = await roleModel.update(
      {
        isDeleted: true,
        isActive: false,
      },
      {
        where: { id: roleId },
      },
    );

    if (deletedRole[0] > 0) {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_DELETE_SUCCESS,
        data: deletedRole,
      };
    } else {
      returnData = {
        ...generalConstant.EN.ROLES.ROLES_DELETE_FAILURE,
        data: null,
      };
    }

    return returnData;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createRole,
  findAllRoles,
  findSingleRole,
  editSingleRole,
  deleteSingleRole,
};
