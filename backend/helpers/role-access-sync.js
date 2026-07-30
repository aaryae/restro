const { Op } = require("sequelize");
const {
  roleModel,
  roleMenuModel,
  roleMenuActionModel,
  roleActionModel,
} = require("../models");
const setupData = require("../configs/setup.json");

const PRIVILEGED_ROLE_TITLES = ["Super Admin", "Admin"];

/**
 * Ensure every menu/action from setup.json exists in the DB.
 * Only inserts missing rows — never deletes or updates existing ones.
 */
const ensureRoleMenusFromSetup = async () => {
  const roleMenus = setupData.roleMenus || [];
  for (const roleMenu of roleMenus) {
    let menu = await roleMenuModel.findOne({
      where: { key: roleMenu.key },
      raw: true,
    });
    if (!menu) {
      menu = (
        await roleMenuModel.create({
          title: roleMenu.title,
          key: roleMenu.key,
        })
      ).get({ plain: true });
    }

    for (const action of roleMenu.actions || []) {
      const existing = await roleMenuActionModel.findOne({
        where: { roleMenuId: menu.id, key: action.key },
        raw: true,
      });
      if (existing) continue;

      await roleMenuActionModel.create({
        roleMenuId: menu.id,
        title: action.title,
        key: action.key,
        clientPath: action.clientPath,
        list: action.list,
        serverPath: action.serverPath,
        requestMethod: action.requestMethod,
      });
    }
  }
};

/**
 * Grant any missing role_menu_actions to a role (additive sync).
 */
const ensureFullAccessForRole = async (roleId) => {
  if (!roleId) return { added: 0 };

  const allActions = await roleMenuActionModel.findAll({
    where: { isDeleted: false },
    attributes: ["id"],
    raw: true,
  });

  const existing = await roleActionModel.findAll({
    where: { roleId, isDeleted: false },
    attributes: ["roleMenuActionId"],
    raw: true,
  });
  const existingIds = new Set(existing.map((row) => row.roleMenuActionId));

  const missing = allActions
    .filter((action) => !existingIds.has(action.id))
    .map((action) => ({
      roleId,
      roleMenuActionId: action.id,
      requiredApproval: false,
    }));

  if (missing.length > 0) {
    await roleActionModel.bulkCreate(missing);
  }

  return { added: missing.length };
};

/**
 * Super Admin / Admin should always hold every menu action.
 * Seeds any missing actions from setup.json, then grants gaps on the role.
 */
const syncPrivilegedRoleAccess = async (user) => {
  const roleId = user?.roleId;
  if (!roleId) return { synced: false, added: 0 };

  // jwt-helper maps role.title → user.roleType
  const roleTitle = user?.roleType;
  let isPrivileged =
    roleId === 1 || PRIVILEGED_ROLE_TITLES.includes(roleTitle);

  if (!isPrivileged) {
    const role = await roleModel.findOne({
      where: { id: roleId, title: { [Op.in]: PRIVILEGED_ROLE_TITLES } },
      raw: true,
    });
    isPrivileged = Boolean(role);
  }

  if (!isPrivileged) return { synced: false, added: 0 };

  await ensureRoleMenusFromSetup();
  const { added } = await ensureFullAccessForRole(roleId);
  return { synced: true, added };
};

module.exports = {
  ensureRoleMenusFromSetup,
  ensureFullAccessForRole,
  syncPrivilegedRoleAccess,
  PRIVILEGED_ROLE_TITLES,
};
