const fs = require("fs");
const { sequelize } = require("../models");

const setup = JSON.parse(
  fs.readFileSync("/app/configs/setup.json", "utf8")
);

const ACTIONS = [];
for (const menu of setup.roleMenus || []) {
  for (const action of menu.actions || []) {
    ACTIONS.push({
      menuKey: menu.key,
      menuTitle: menu.title,
      ...action,
    });
  }
}

(async () => {
  await sequelize.authenticate();
  const [schemas] = await sequelize.query(
    `SELECT nspname FROM pg_namespace WHERE nspname LIKE 'tenant_%' ORDER BY 1`
  );

  for (const { nspname: schema } of schemas) {
    let inserted = 0;
    let updated = 0;
    let grants = 0;

    for (const action of ACTIONS) {
      // Ensure menu
      let [menus] = await sequelize.query(
        `SELECT id FROM "${schema}".role_menus WHERE key = :key LIMIT 1`,
        { replacements: { key: action.menuKey } }
      );
      let menuId = menus[0]?.id;
      if (!menuId) {
        const [created] = await sequelize.query(
          `INSERT INTO "${schema}".role_menus (title, key, "isDeleted", "createdAt", "updatedAt")
           VALUES (:title, :key, false, NOW(), NOW())
           RETURNING id`,
          { replacements: { title: action.menuTitle, key: action.menuKey } }
        );
        menuId = created[0].id;
      }

      const [existing] = await sequelize.query(
        `SELECT id, "serverPath", "requestMethod", "clientPath", title, list
         FROM "${schema}".role_menu_actions
         WHERE "roleMenuId" = :menuId AND key = :key
         LIMIT 1`,
        { replacements: { menuId, key: action.key } }
      );

      if (!existing[0]) {
        await sequelize.query(
          `INSERT INTO "${schema}".role_menu_actions
           ("roleMenuId", title, key, "clientPath", list, "serverPath", "requestMethod", "isDeleted", "createdAt", "updatedAt")
           VALUES (:menuId, :title, :key, :clientPath, :list, :serverPath, :requestMethod, false, NOW(), NOW())`,
          {
            replacements: {
              menuId,
              title: action.title,
              key: action.key,
              clientPath: action.clientPath,
              list: action.list,
              serverPath: action.serverPath,
              requestMethod: action.requestMethod,
            },
          }
        );
        inserted += 1;
      } else {
        const row = existing[0];
        if (
          row.serverPath !== action.serverPath ||
          row.requestMethod !== action.requestMethod ||
          row.clientPath !== action.clientPath ||
          row.title !== action.title ||
          row.list !== action.list
        ) {
          await sequelize.query(
            `UPDATE "${schema}".role_menu_actions
             SET title = :title,
                 "clientPath" = :clientPath,
                 list = :list,
                 "serverPath" = :serverPath,
                 "requestMethod" = :requestMethod,
                 "isDeleted" = false,
                 "updatedAt" = NOW()
             WHERE id = :id`,
            {
              replacements: {
                id: row.id,
                title: action.title,
                clientPath: action.clientPath,
                list: action.list,
                serverPath: action.serverPath,
                requestMethod: action.requestMethod,
              },
            }
          );
          updated += 1;
        }
      }
    }

    // Soft-delete obsolete Delete Order if View One Order exists
    await sequelize.query(
      `UPDATE "${schema}".role_menu_actions
       SET "isDeleted" = true, "updatedAt" = NOW()
       WHERE key = 'delete' AND "serverPath" = '/order/:id' AND "requestMethod" = 'DELETE'
         AND "isDeleted" = false`
    );

    // Grant all actions to Super Admin + Admin
    const [roles] = await sequelize.query(
      `SELECT id FROM "${schema}".roles
       WHERE (id = 1 OR title IN ('Super Admin','Admin')) AND "isDeleted" = false`
    );
    const [allActions] = await sequelize.query(
      `SELECT id FROM "${schema}".role_menu_actions WHERE "isDeleted" = false`
    );
    for (const role of roles) {
      for (const action of allActions) {
        const [exists] = await sequelize.query(
          `SELECT id FROM "${schema}".role_actions
           WHERE "roleId" = :roleId AND "roleMenuActionId" = :actionId AND "isDeleted" = false`,
          { replacements: { roleId: role.id, actionId: action.id } }
        );
        if (!exists[0]) {
          await sequelize.query(
            `INSERT INTO "${schema}".role_actions
             ("roleId", "roleMenuActionId", "requiredApproval", "isDeleted", "createdAt", "updatedAt")
             VALUES (:roleId, :actionId, false, false, NOW(), NOW())`,
            { replacements: { roleId: role.id, actionId: action.id } }
          );
          grants += 1;
        }
      }
    }

    // Grant new order/table keys to any role that already had that module
    const moduleKeys = {
      order: [
        "view-one",
        "view-active-orders",
        "edit-order-status",
        "bulk-serve-order-items",
        "move-order-items",
      ],
      table: ["move-orders"],
      account: ["view-one", "view-totals"],
      revenue: ["view-today", "view-by-account"],
      purchase: ["pay", "complete", "cancel"],
      expense: ["pay"],
      reports: [
        "view-daily-revenue",
        "view-daily-table-sessions",
        "view-counter-cash",
      ],
    };

    for (const [menuKey, keys] of Object.entries(moduleKeys)) {
      const [menus] = await sequelize.query(
        `SELECT id FROM "${schema}".role_menus WHERE key = :menuKey LIMIT 1`,
        { replacements: { menuKey } }
      );
      if (!menus[0]) continue;
      const menuId = menus[0].id;
      const [rolesWithModule] = await sequelize.query(
        `SELECT DISTINCT ra."roleId" FROM "${schema}".role_actions ra
         JOIN "${schema}".role_menu_actions rma ON rma.id = ra."roleMenuActionId"
         WHERE rma."roleMenuId" = :menuId AND ra."isDeleted" = false`,
        { replacements: { menuId } }
      );
      for (const key of keys) {
        const [actions] = await sequelize.query(
          `SELECT id FROM "${schema}".role_menu_actions
           WHERE "roleMenuId" = :menuId AND key = :key AND "isDeleted" = false`,
          { replacements: { menuId, key } }
        );
        if (!actions[0]) continue;
        for (const { roleId } of rolesWithModule) {
          const [exists] = await sequelize.query(
            `SELECT id FROM "${schema}".role_actions
             WHERE "roleId" = :roleId AND "roleMenuActionId" = :actionId AND "isDeleted" = false`,
            { replacements: { roleId, actionId: actions[0].id } }
          );
          if (!exists[0]) {
            await sequelize.query(
              `INSERT INTO "${schema}".role_actions
               ("roleId", "roleMenuActionId", "requiredApproval", "isDeleted", "createdAt", "updatedAt")
               VALUES (:roleId, :actionId, false, false, NOW(), NOW())`,
              { replacements: { roleId, actionId: actions[0].id } }
            );
            grants += 1;
          }
        }
      }
    }

    const [check] = await sequelize.query(
      `SELECT count(*)::int AS c FROM "${schema}".role_menu_actions
       WHERE key = 'view-active-orders' AND "isDeleted" = false`
    );
    console.log(
      `${schema} insert=${inserted} update=${updated} grants=${grants} activeOrders=${check[0].c}`
    );
  }

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
