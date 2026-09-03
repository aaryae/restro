const { Op } = require("sequelize");
const {
  trashItemModel,
  productModel,
  productCategoryModel,
  customerModel,
  supplierModel,
  addonModel,
  openItemModel,
  departmentModel,
  floorModel,
  tableModel,
  expenseCategoryModel,
  purchaseCategoryModel,
  emailTemplateModel,
  measuringUnitModel,
  stockGroupModel,
  stockItemModel,
  sequelize,
} = require("../models");

const RETENTION_DAYS = 30;

const getResourceModels = () => ({
  product: productModel,
  product_category: productCategoryModel,
  customer: customerModel,
  supplier: supplierModel,
  addon: addonModel,
  open_item: openItemModel,
  department: departmentModel,
  floor: floorModel,
  table: tableModel,
  expense_category: expenseCategoryModel,
  purchase_category: purchaseCategoryModel,
  email_template: emailTemplateModel,
  measuring_unit: measuringUnitModel,
  stock_group: stockGroupModel,
  stock_item: stockItemModel,
});

const RESOURCE_LABELS = {
  product: "Product",
  product_category: "Product Category",
  customer: "Customer",
  supplier: "Supplier",
  addon: "Addon",
  open_item: "Open Item",
  department: "Department",
  floor: "Floor",
  table: "Table",
  expense_category: "Expense Category",
  purchase_category: "Purchase Category",
  email_template: "Email Template",
  measuring_unit: "Measuring Unit",
  stock_group: "Stock Group",
  stock_item: "Stock Item",
  user: "User",
};

const displayNameFromRecord = (resourceType, record) => {
  const data = typeof record?.toJSON === "function" ? record.toJSON() : record;
  return (
    data?.name ||
    data?.title ||
    data?.tableNo ||
    data?.floorNo ||
    data?.username ||
    data?.email ||
    `#${data?.id || ""}`
  );
};

const expiresAtFromNow = () => {
  const d = new Date();
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d;
};

/** Ensure trash JSON is a plain object (handles string / Buffer / dataValues). */
const normalizePayload = (raw) => {
  let data = raw;
  if (data == null) return null;

  if (Buffer.isBuffer(data)) {
    data = data.toString("utf8");
  }

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (typeof data !== "object" || Array.isArray(data)) return null;

  // Unwrap accidental Sequelize shapes
  if (data.dataValues && typeof data.dataValues === "object") {
    data = data.dataValues;
  }

  return data;
};

/** Keep only real table columns so association keys cannot break create(). */
const pickModelAttributes = (Model, data, { includeId = true } = {}) => {
  const attrs = Model?.rawAttributes || {};
  const out = {};
  for (const key of Object.keys(attrs)) {
    if (key === "createdAt" || key === "updatedAt") continue;
    if (!includeId && key === "id") continue;
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    if (data[key] === undefined) continue;
    out[key] = data[key];
  }
  return out;
};

const snapshotRecord = (resourceType, record) => {
  const Model = getResourceModels()[resourceType];
  const plain =
    typeof record?.get === "function"
      ? record.get({ plain: true })
      : typeof record?.toJSON === "function"
        ? record.toJSON()
        : { ...record };

  if (Model?.rawAttributes) {
    return pickModelAttributes(Model, plain, { includeId: true });
  }

  // Fallback: strip common association bags
  const {
    mediaArr,
    addons,
    variants,
    product_category,
    department,
    ...rest
  } = plain || {};
  return rest;
};

/**
 * Snapshot a record into trash before hard-delete.
 * Call this right before Model.destroy().
 */
const archiveToTrash = async ({
  resourceType,
  record,
  req,
  transaction,
}) => {
  if (!record) return null;
  const payload = snapshotRecord(resourceType, record);
  const deletedBy = req?.user?.id || null;
  const deletedByName =
    req?.user?.username || req?.user?.email || req?.user?.name || null;

  return trashItemModel.create(
    {
      resourceType,
      resourceId: payload.id,
      displayName: String(displayNameFromRecord(resourceType, payload)),
      payload,
      deletedBy,
      deletedByName,
      expiresAt: expiresAtFromNow(),
    },
    { transaction },
  );
};

const listTrash = async (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const resourceType = req.query.resourceType;

  const where = {
    [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
  };
  if (resourceType) where.resourceType = resourceType;

  const { count, rows } = await trashItemModel.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  return {
    status: 200,
    success: true,
    message: "Recently deleted items retrieved",
    data: {
      data: rows.map((row) => {
        const plain = row.toJSON();
        return {
          ...plain,
          resourceLabel:
            RESOURCE_LABELS[plain.resourceType] || plain.resourceType,
        };
      }),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    },
  };
};

const restoreTrashItem = async (req) => {
  const id = +req.params.id;
  const item = await trashItemModel.findByPk(id);
  if (!item) {
    return {
      status: 404,
      success: false,
      message: "Deleted item not found",
      data: null,
    };
  }

  if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
    await item.destroy();
    return {
      status: 410,
      success: false,
      message: "This item has expired and can no longer be restored",
      data: null,
    };
  }

  const Model = getResourceModels()[item.resourceType];
  if (!Model) {
    return {
      status: 400,
      success: false,
      message: `Restore is not supported for ${item.resourceType}`,
      data: null,
    };
  }

  const normalized = normalizePayload(item.payload);
  if (!normalized) {
    return {
      status: 422,
      success: false,
      message:
        "Archived data is missing or corrupted and cannot be restored. Permanently delete this entry and recreate the item.",
      data: null,
    };
  }

  const withId = pickModelAttributes(Model, normalized, { includeId: true });
  const withoutId = pickModelAttributes(Model, normalized, {
    includeId: false,
  });

  // Guard against empty snapshots (would surface as notNull violations).
  const requiredAttrs = Object.entries(Model.rawAttributes || {})
    .filter(
      ([key, attr]) =>
        key !== "id" &&
        attr.allowNull === false &&
        attr.defaultValue === undefined &&
        !attr._autoGenerated,
    )
    .map(([key]) => key);

  const missingRequired = requiredAttrs.filter(
    (key) => withoutId[key] === null || withoutId[key] === undefined,
  );
  if (missingRequired.length > 0) {
    return {
      status: 422,
      success: false,
      message: `Cannot restore "${item.displayName}": archived data is incomplete (missing ${missingRequired.join(", ")}). Permanently delete this entry and recreate the item.`,
      data: { missing: missingRequired },
    };
  }

  const originalId = withId.id;
  const transaction = await sequelize.transaction();
  try {
    const existing = originalId
      ? await Model.findByPk(originalId, { transaction })
      : null;

    if (existing) {
      await transaction.rollback();
      return {
        status: 409,
        success: false,
        message:
          "A record with the same id already exists. Remove it first, or restore failed.",
        data: null,
      };
    }

    // Prefer restoring with the original id so historical links still work.
    // Copy values so Sequelize cannot mutate the snapshot object.
    await Model.create({ ...withId }, { transaction });
    await item.destroy({ transaction });
    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: `"${item.displayName}" restored successfully`,
      data: { resourceType: item.resourceType, resourceId: originalId },
    };
  } catch (error) {
    await transaction.rollback();

    // Retry without forcing id (e.g. unique slug conflicts on id reuse edge cases)
    try {
      const created = await Model.create({ ...withoutId });
      await item.destroy();
      return {
        status: 200,
        success: true,
        message: `"${item.displayName}" restored successfully`,
        data: {
          resourceType: item.resourceType,
          resourceId: created.id,
        },
      };
    } catch (retryError) {
      const message =
        retryError?.original?.sqlMessage ||
        retryError?.message ||
        "Failed to restore item";
      return {
        status: 500,
        success: false,
        message,
        data: null,
      };
    }
  }
};

const permanentlyDeleteTrashItem = async (req) => {
  const item = await trashItemModel.findByPk(+req.params.id);
  if (!item) {
    return {
      status: 404,
      success: false,
      message: "Deleted item not found",
      data: null,
    };
  }
  await item.destroy();
  return {
    status: 200,
    success: true,
    message: "Item permanently deleted",
    data: null,
  };
};

const purgeExpired = async () => {
  const deleted = await trashItemModel.destroy({
    where: {
      expiresAt: { [Op.lt]: new Date() },
    },
  });
  return deleted;
};

module.exports = {
  archiveToTrash,
  listTrash,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
  purgeExpired,
  RESOURCE_LABELS,
  RETENTION_DAYS,
};
