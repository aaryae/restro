const { Op } = require("sequelize");
const {
  stockItemModel,
  stockHistoryModel,
  stockItemUnitModel,
  productRecipeModel,
  measuringUnitModel,
  stockGroupModel,
  supplierModel,
  stockSupplierBalanceModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");
const {
  readSheet,
  normalizeRows,
  missingRequiredColumns,
} = require("../../lib/stock-item-import");
const {
  PurchaseStockSyncError,
  applyPurchaseToStock,
  createCompletedPurchaseForStockAdjust,
} = require("../../lib/purchase-stock-sync");
const { saveStockUnits } = require("../../lib/stock-units");
const {
  addSupplierQty,
  takeSupplierQty,
  receiveStock,
} = require("../../lib/stock-suppliers");
const {
  UnitChainError,
  formatBreakdown,
  formatEquivalence,
} = require("../../lib/unit-quantity");

const MAX_IMPORT_ROWS = 2000;

const OUTBOUND_TYPES = new Set(["adjustment_out", "waste"]);

/**
 * Stock history.createdBy FKs to the cafe schema's users table. The JWT user
 * id is often missing there (trial / wrong schema), so leave it null.
 */
const historyCreatedBy = () => null;

const uniqueSlug = async (name, excludeId = null, transaction) => {
  const slugBase = slugGenerator(name);
  let slug = slugBase;
  let count = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await stockItemModel.findOne({ where, transaction });
    if (!existing) return slug;
    slug = `${slugBase}-${count}`;
    count += 1;
  }
};

const itemIncludes = [
  { model: measuringUnitModel, as: "measuringUnit", attributes: ["id", "name", "symbol"] },
  { model: stockGroupModel, as: "stockGroup", attributes: ["id", "name"] },
  { model: supplierModel, as: "supplier", attributes: ["id", "name"] },
  {
    model: stockItemUnitModel,
    as: "units",
    separate: true,
    order: [["level", "ASC"]],
    include: [
      {
        model: measuringUnitModel,
        as: "measuringUnit",
        attributes: ["id", "name", "symbol"],
      },
    ],
  },
  {
    model: stockSupplierBalanceModel,
    as: "supplierBalances",
    separate: true,
    include: [
      { model: supplierModel, as: "supplier", attributes: ["id", "name"] },
    ],
  },
];

const toNumber = (value) => Number(value || 0);

const presentStockItem = (item) => {
  if (!item) return item;
  const plain = item.get ? item.get({ plain: true }) : { ...item };
  const units = [...(plain.units || [])].sort(
    (a, b) => Number(a.level) - Number(b.level),
  );
  return {
    ...plain,
    units: units.map((level) => ({
      ...level,
      factor: toNumber(level.factor),
      factorToBase: toNumber(level.factorToBase),
    })),
    quantityLabel: formatBreakdown(
      plain.quantity,
      plain.measuringUnit,
      units,
    ),
    openingLabel: formatBreakdown(
      plain.openingQuantity,
      plain.measuringUnit,
      units,
    ),
    equivalence: formatEquivalence(units, plain.measuringUnit),
    supplierBalances: (plain.supplierBalances || []).map((row) => ({
      supplierId: row.supplierId || null,
      supplierName: row.supplier?.name || null,
      quantity: toNumber(row.quantity),
      quantityLabel: formatBreakdown(
        row.quantity,
        plain.measuringUnit,
        units,
      ),
    })),
  };
};

const nameKey = (name) => String(name || "").trim().toLowerCase();

const sameNameWhere = (name, measuringUnitId) => ({
  measuringUnitId,
  [Op.and]: [
    sequelize.where(
      sequelize.fn("lower", sequelize.fn("btrim", sequelize.col("name"))),
      nameKey(name),
    ),
  ],
});

const activeStockWhere = { mergedIntoId: null };

const roundMoney = (value) => Math.round(toNumber(value) * 100) / 100;

async function annotateBatches(rows) {
  const names = [
    ...new Set(rows.map((row) => nameKey(row.name)).filter(Boolean)),
  ];
  if (!names.length) return rows;

  const peers = await stockItemModel.findAll({
    attributes: ["id", "name", "measuringUnitId"],
    where: {
      ...activeStockWhere,
      [Op.and]: [
        sequelize.where(
          sequelize.fn("lower", sequelize.fn("btrim", sequelize.col("name"))),
          { [Op.in]: names },
        ),
      ],
    },
    raw: true,
  });

  const rowIds = rows.map((row) => Number(row.id)).filter(Boolean);
  const mergedChildren = rowIds.length
    ? await stockItemModel.findAll({
        attributes: ["id", "mergedIntoId"],
        where: { mergedIntoId: { [Op.in]: rowIds } },
        raw: true,
      })
    : [];
  const undoCountByKeep = new Map();
  for (const child of mergedChildren) {
    const keepId = Number(child.mergedIntoId);
    undoCountByKeep.set(keepId, (undoCountByKeep.get(keepId) || 0) + 1);
  }

  const groups = new Map();
  for (const peer of peers) {
    const key = `${nameKey(peer.name)}|${peer.measuringUnitId}`;
    const ids = groups.get(key) || [];
    ids.push(Number(peer.id));
    groups.set(key, ids);
  }
  for (const ids of groups.values()) ids.sort((a, b) => a - b);

  return rows.map((row) => {
    const ids =
      groups.get(`${nameKey(row.name)}|${row.measuringUnitId}`) || [row.id];
    const oldestId = ids[0];
    const mergedCount = undoCountByKeep.get(Number(row.id)) || 0;
    return {
      ...row,
      isNewStock: ids.length > 1 && Number(row.id) !== oldestId,
      sameNameCount: ids.length,
      oldestStockId: oldestId,
      canUndoSync: mergedCount > 0,
      mergedBatchCount: mergedCount,
    };
  });
}

async function mergeStockInto(keep, dup, transaction) {
  const keepBefore = {
    quantity: toNumber(keep.quantity),
    defaultPrice: toNumber(keep.defaultPrice),
    openingQuantity: toNumber(keep.openingQuantity),
  };
  const addQty = toNumber(dup.quantity);
  const nextQty = roundMoney(keepBefore.quantity + addQty);
  const nextRate =
    nextQty > 0
      ? roundMoney(
          (keepBefore.quantity * keepBefore.defaultPrice +
            addQty * toNumber(dup.defaultPrice)) /
            nextQty,
        )
      : keepBefore.defaultPrice;
  const openingQuantity = roundMoney(
    keepBefore.openingQuantity + toNumber(dup.openingQuantity),
  );

  const balances = await stockSupplierBalanceModel.findAll({
    where: { stockItemId: dup.id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const movedBalances = [];
  for (const balance of balances) {
    const qty = toNumber(balance.quantity);
    movedBalances.push({
      supplierId: balance.supplierId || null,
      quantity: qty,
    });
    const existing = await stockSupplierBalanceModel.findOne({
      where: {
        stockItemId: keep.id,
        supplierId: balance.supplierId || null,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existing) {
      await existing.update(
        { quantity: roundMoney(toNumber(existing.quantity) + qty) },
        { transaction },
      );
      await balance.destroy({ transaction });
    } else {
      await balance.update({ stockItemId: keep.id }, { transaction });
    }
  }

  await keep.update(
    {
      quantity: nextQty,
      defaultPrice: nextRate,
      openingQuantity,
    },
    { transaction },
  );

  await dup.update(
    {
      quantity: 0,
      openingQuantity: 0,
      mergedIntoId: keep.id,
      syncPayload: {
        keepBefore,
        quantity: addQty,
        defaultPrice: toNumber(dup.defaultPrice),
        openingQuantity: toNumber(dup.openingQuantity),
        supplierBalances: movedBalances,
      },
    },
    { transaction },
  );
}

async function undoMergeFrom(keep, dup, transaction) {
  const payload = dup.syncPayload || {};
  const wantQty = toNumber(payload.quantity);
  const wantOpening = toNumber(payload.openingQuantity);
  const keepQty = toNumber(keep.quantity);
  const restoreQty = roundMoney(Math.min(wantQty, Math.max(0, keepQty)));
  const keepOpening = toNumber(keep.openingQuantity);
  const restoreOpening = roundMoney(
    Math.min(wantOpening, Math.max(0, keepOpening)),
  );

  const movedBalances = Array.isArray(payload.supplierBalances)
    ? payload.supplierBalances
    : [];
  for (const moved of movedBalances) {
    const take = roundMoney(Math.min(toNumber(moved.quantity), restoreQty || toNumber(moved.quantity)));
    if (take <= 0) continue;
    const keepBalance = await stockSupplierBalanceModel.findOne({
      where: {
        stockItemId: keep.id,
        supplierId: moved.supplierId || null,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (keepBalance) {
      const left = roundMoney(toNumber(keepBalance.quantity) - take);
      if (left <= 0.001) await keepBalance.destroy({ transaction });
      else await keepBalance.update({ quantity: left }, { transaction });
    }
    const dupBalance = await stockSupplierBalanceModel.findOne({
      where: {
        stockItemId: dup.id,
        supplierId: moved.supplierId || null,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (dupBalance) {
      await dupBalance.update(
        { quantity: roundMoney(toNumber(dupBalance.quantity) + take) },
        { transaction },
      );
    } else {
      await stockSupplierBalanceModel.create(
        {
          stockItemId: dup.id,
          supplierId: moved.supplierId || null,
          quantity: take,
        },
        { transaction },
      );
    }
  }

  await keep.update(
    {
      quantity: roundMoney(keepQty - restoreQty),
      openingQuantity: roundMoney(keepOpening - restoreOpening),
      defaultPrice:
        payload.keepBefore && payload.keepBefore.defaultPrice != null
          ? toNumber(payload.keepBefore.defaultPrice)
          : toNumber(keep.defaultPrice),
    },
    { transaction },
  );

  await dup.update(
    {
      quantity: restoreQty,
      openingQuantity: restoreOpening,
      defaultPrice:
        payload.defaultPrice != null
          ? toNumber(payload.defaultPrice)
          : toNumber(dup.defaultPrice),
      mergedIntoId: null,
      syncPayload: null,
    },
    { transaction },
  );
}

const syncSameName = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const seed = await stockItemModel.findByPk(+req.params.id, { transaction });
    if (!seed || seed.mergedIntoId) {
      await transaction.rollback();
      return { ...generalConstant.EN.STOCK_ITEM.NOT_FOUND, data: null };
    }

    const family = await stockItemModel.findAll({
      where: {
        ...sameNameWhere(seed.name, seed.measuringUnitId),
        ...activeStockWhere,
      },
      order: [["id", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (family.length < 2) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "There is no other stock with this name and unit to sync.",
        data: null,
      };
    }

    const keep = family[0];
    for (const dup of family.slice(1)) {
      await mergeStockInto(keep, dup, transaction);
    }

    await transaction.commit();
    const full = await stockItemModel.findByPk(keep.id, {
      include: itemIncludes,
    });
    const [presented] = await annotateBatches([presentStockItem(full)]);
    return {
      status: 200,
      success: true,
      message: `Combined into ${keep.name}. You can undo this sync anytime.`,
      data: presented,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    const response = stockWriteError(error);
    if (response) return response;
    throw error;
  }
};

const undoSyncSameName = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const keep = await stockItemModel.findByPk(+req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!keep || keep.mergedIntoId) {
      await transaction.rollback();
      return { ...generalConstant.EN.STOCK_ITEM.NOT_FOUND, data: null };
    }

    const merged = await stockItemModel.findAll({
      where: { mergedIntoId: keep.id },
      order: [["id", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!merged.length) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Nothing to undo. This stock has no synced batches.",
        data: null,
      };
    }

    for (const dup of [...merged].reverse()) {
      await undoMergeFrom(keep, dup, transaction);
      await keep.reload({ transaction, lock: transaction.LOCK.UPDATE });
    }

    await transaction.commit();
    const full = await stockItemModel.findByPk(keep.id, {
      include: itemIncludes,
    });
    const [presented] = await annotateBatches([presentStockItem(full)]);
    return {
      status: 200,
      success: true,
      message: `Undid sync for ${keep.name}. Newer batches are separate again.`,
      data: presented,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    const response = stockWriteError(error);
    if (response) return response;
    throw error;
  }
};

const stockWriteError = (error) => {
  if (error instanceof PurchaseStockSyncError) return error.toResponse();
  if (error instanceof UnitChainError) return error.toResponse();
  return null;
};

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      measuringUnitId,
      stockGroupId,
      supplierId,
      defaultPrice = 0,
      openingQuantity = 0,
      openingRate,
      lowStockThreshold,
      accountId,
      paymentTerms,
      units,
    } = req.body;

    const unit = await measuringUnitModel.findByPk(measuringUnitId, {
      transaction,
    });
    if (!unit) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Measuring unit not found",
        data: null,
      };
    }

    const trimmedName = String(name || "").trim();
    const rate = toNumber(
      openingRate !== undefined ? openingRate : defaultPrice,
    );
    const openingQty = toNumber(openingQuantity);
    const price = toNumber(defaultPrice);
    const paidOpening =
      openingQty > 0 && Boolean(supplierId) && Boolean(accountId);

    if (paidOpening && !req.user?.id) {
      await transaction.rollback();
      return {
        status: 401,
        success: false,
        message: "Authentication required to record purchase",
        data: null,
      };
    }

    const slug = await uniqueSlug(trimmedName, null, transaction);
    const item = await stockItemModel.create(
      {
        name: trimmedName,
        slug,
        measuringUnitId,
        stockGroupId: stockGroupId || null,
        supplierId: supplierId || null,
        defaultPrice: price,
        openingQuantity: openingQty,
        quantity: 0,
        lowStockThreshold:
          lowStockThreshold === undefined || lowStockThreshold === null
            ? null
            : toNumber(lowStockThreshold),
      },
      { transaction },
    );

    if (Array.isArray(units)) {
      await saveStockUnits(item.id, item.measuringUnitId, units, transaction);
    }

    if (openingQty > 0 && paidOpening) {
      const purchase = await createCompletedPurchaseForStockAdjust({
        stockItem: item,
        quantity: openingQty,
        rate,
        accountId,
        supplierId,
        paymentTerms: paymentTerms || "cash",
        enteredByUserId: req.user.id,
        note: "Opening stock purchase",
        transaction,
      });
      await applyPurchaseToStock(purchase.id, {
        transaction,
        userId: null,
      });
    } else if (openingQty > 0) {
      await receiveStock(item, openingQty, rate, null, transaction);
      await stockHistoryModel.create(
        {
          stockItemId: item.id,
          type: "opening",
          quantity: openingQty,
          rate,
          value: openingQty * rate,
          note: "Opening stock",
          supplierSplit: [{ supplierId: null, quantity: openingQty }],
          createdBy: historyCreatedBy(),
        },
        { transaction },
      );
    }

    await transaction.commit();

    const full = await stockItemModel.findByPk(item.id, {
      include: itemIncludes,
    });

    const [presented] = await annotateBatches([presentStockItem(full)]);

    return {
      ...generalConstant.EN.STOCK_ITEM.CREATE_SUCCESS,
      data: presented,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    const response = stockWriteError(error);
    if (response) return response;
    throw error;
  }
};

const stockListOrder = (sortBy) => {
  const key = String(sortBy || "default").trim();
  const lowStockRank = sequelize.literal(
    `CASE WHEN "StockItem"."lowStockThreshold" IS NOT NULL AND "StockItem"."quantity" <= "StockItem"."lowStockThreshold" THEN 0 ELSE 1 END`,
  );
  const stockValue = sequelize.literal(
    `"StockItem"."quantity" * "StockItem"."defaultPrice"`,
  );

  switch (key) {
    case "nameAsc":
      return [
        ["name", "ASC"],
        ["id", "ASC"],
      ];
    case "nameDesc":
      return [
        ["name", "DESC"],
        ["id", "DESC"],
      ];
    case "rateAsc":
      return [
        ["defaultPrice", "ASC"],
        ["id", "DESC"],
      ];
    case "rateDesc":
      return [
        ["defaultPrice", "DESC"],
        ["id", "DESC"],
      ];
    case "openingAsc":
      return [
        ["openingQuantity", "ASC"],
        ["id", "DESC"],
      ];
    case "openingDesc":
      return [
        ["openingQuantity", "DESC"],
        ["id", "DESC"],
      ];
    case "closingAsc":
      return [
        ["quantity", "ASC"],
        ["id", "DESC"],
      ];
    case "closingDesc":
      return [
        ["quantity", "DESC"],
        ["id", "DESC"],
      ];
    case "valueAsc":
      return [
        [stockValue, "ASC"],
        ["id", "DESC"],
      ];
    case "valueDesc":
      return [
        [stockValue, "DESC"],
        ["id", "DESC"],
      ];
    case "lowStockFirst":
      return [
        [lowStockRank, "ASC"],
        ["quantity", "ASC"],
        ["id", "DESC"],
      ];
    case "oldest":
      return [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ];
    case "newest":
      return [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ];
    case "default":
    default:
      return [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ];
  }
};

const list = async (req) => {
  try {
    const { limit, page, name, stockGroupId, supplierId, lowStock, sortBy } =
      req.query;
    const filters = {};
    if (name) filters.name = { [Op.iLike]: `%${name}%` };
    if (stockGroupId) filters.stockGroupId = +stockGroupId;
    if (supplierId) filters.supplierId = +supplierId;
    if (String(lowStock) === "true" || String(lowStock) === "1") {
      filters[Op.and] = [
        { lowStockThreshold: { [Op.ne]: null } },
        sequelize.where(
          sequelize.col("StockItem.quantity"),
          Op.lte,
          sequelize.col("StockItem.lowStockThreshold"),
        ),
      ];
    }

    const result = await paginate(stockItemModel, {
      limit,
      page,
      filters: { ...filters, ...activeStockWhere },
      include: itemIncludes,
      order: stockListOrder(sortBy),
    });

    result.data = await annotateBatches(
      (result.data || []).map(presentStockItem),
    );

    return {
      ...generalConstant.EN.STOCK_ITEM.LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const item = await stockItemModel.findByPk(+req.params.id, {
      include: itemIncludes,
    });
    if (!item) {
      return {
        ...generalConstant.EN.STOCK_ITEM.NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.STOCK_ITEM.GET_SUCCESS,
      data: presentStockItem(item),
    };
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const item = await stockItemModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!item) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.STOCK_ITEM.NOT_FOUND,
        data: null,
      };
    }

    const {
      name,
      measuringUnitId,
      stockGroupId,
      supplierId,
      defaultPrice,
      lowStockThreshold,
      units,
    } = req.body;

    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = await uniqueSlug(name, item.id, transaction);
    }
    const previousBaseUnitId = item.measuringUnitId;
    if (measuringUnitId) updates.measuringUnitId = measuringUnitId;
    const nextBaseUnitId = updates.measuringUnitId || previousBaseUnitId;
    if (stockGroupId !== undefined) updates.stockGroupId = stockGroupId || null;
    if (supplierId !== undefined) updates.supplierId = supplierId || null;
    if (defaultPrice !== undefined) updates.defaultPrice = toNumber(defaultPrice);
    if (lowStockThreshold !== undefined) {
      updates.lowStockThreshold =
        lowStockThreshold === null ? null : toNumber(lowStockThreshold);
    }

    await item.update(updates, { transaction });
    if (Array.isArray(units)) {
      await saveStockUnits(item.id, nextBaseUnitId, units, transaction);
    } else if (
      updates.measuringUnitId &&
      Number(updates.measuringUnitId) !== Number(previousBaseUnitId)
    ) {
      await stockItemUnitModel.destroy({
        where: { stockItemId: item.id },
        transaction,
      });
    }
    await transaction.commit();

    const full = await stockItemModel.findByPk(item.id, {
      include: itemIncludes,
    });

    return {
      ...generalConstant.EN.STOCK_ITEM.UPDATE_SUCCESS,
      data: presentStockItem(full),
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    const response = stockWriteError(error);
    if (response) return response;
    throw error;
  }
};

const adjust = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const item = await stockItemModel.findByPk(+req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!item) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.STOCK_ITEM.NOT_FOUND,
        data: null,
      };
    }

    const {
      type,
      quantity,
      rate,
      note,
      accountId,
      supplierId,
      paymentTerms,
    } = req.body;
    const qty = toNumber(quantity);
    const applyRate =
      rate !== undefined && rate !== null
        ? toNumber(rate)
        : toNumber(item.defaultPrice);
    const currentQty = toNumber(item.quantity);

    if (OUTBOUND_TYPES.has(type) && qty > currentQty) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.STOCK_ITEM.INSUFFICIENT_STOCK,
        data: null,
      };
    }

    let purchaseId = null;

    if (type === "purchase") {
      const resolvedSupplierId = supplierId || item.supplierId;
      if (!resolvedSupplierId) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Supplier is required for Purchase / Restock",
          data: null,
        };
      }
      if (!accountId) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Account is required for Purchase / Restock",
          data: null,
        };
      }
      if (!req.user?.id) {
        await transaction.rollback();
        return {
          status: 401,
          success: false,
          message: "Authentication required to record purchase",
          data: null,
        };
      }

      const purchase = await createCompletedPurchaseForStockAdjust({
        stockItem: item,
        quantity: qty,
        rate: applyRate,
        accountId,
        supplierId: resolvedSupplierId,
        paymentTerms: paymentTerms || "cash",
        enteredByUserId: req.user.id,
        note: note || null,
        transaction,
      });
      purchaseId = purchase.id;

      // Stock qty + history (linked to finance purchase)
      await applyPurchaseToStock(purchase.id, {
        transaction,
        userId: null,
      });
    } else if (type === "adjustment_in") {
      await receiveStock(item, qty, applyRate, null, transaction);
      await stockHistoryModel.create(
        {
          stockItemId: item.id,
          type,
          quantity: qty,
          rate: applyRate,
          value: qty * applyRate,
          note: note || null,
          supplierSplit: [{ supplierId: null, quantity: qty }],
          createdBy: historyCreatedBy(),
        },
        { transaction },
      );
    } else {
      const taken = await takeSupplierQty(item.id, qty, transaction);
      await item.update(
        { quantity: currentQty - qty },
        { transaction },
      );
      await stockHistoryModel.create(
        {
          stockItemId: item.id,
          type,
          quantity: qty,
          rate: applyRate,
          value: qty * applyRate,
          note: note || null,
          supplierSplit: taken,
          createdBy: historyCreatedBy(),
        },
        { transaction },
      );
    }

    await transaction.commit();

    const full = await stockItemModel.findByPk(item.id, {
      include: itemIncludes,
    });

    return {
      ...generalConstant.EN.STOCK_ITEM.ADJUST_SUCCESS,
      data: { item: presentStockItem(full), purchaseId },
    };
  } catch (error) {
    await transaction.rollback();
    if (error instanceof PurchaseStockSyncError) {
      return error.toResponse();
    }
    throw error;
  }
};

const summary = async () => {
  try {
    const items = await stockItemModel.findAll({
      attributes: ["id", "quantity", "defaultPrice", "lowStockThreshold"],
      where: activeStockWhere,
      raw: true,
    });

    const totalItems = items.length;
    let totalStockValue = 0;
    let lowStockItems = 0;

    for (const item of items) {
      const qty = toNumber(item.quantity);
      const price = toNumber(item.defaultPrice);
      totalStockValue += qty * price;
      if (
        item.lowStockThreshold != null &&
        qty <= toNumber(item.lowStockThreshold)
      ) {
        lowStockItems += 1;
      }
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const restockedThisWeek = await stockHistoryModel.count({
      where: {
        type: { [Op.in]: ["purchase", "adjustment_in"] },
        createdAt: { [Op.gte]: weekAgo },
      },
      distinct: true,
      col: "stockItemId",
    });

    return {
      ...generalConstant.EN.STOCK_ITEM.SUMMARY_SUCCESS,
      data: {
        totalItems,
        totalStockValue: Number(totalStockValue.toFixed(2)),
        restockedThisWeek,
        lowStockItems,
      },
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const item = await stockItemModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!item) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.STOCK_ITEM.NOT_FOUND,
        data: null,
      };
    }

    if (item.mergedIntoId) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "This batch was synced into another stock item. Undo the sync first.",
        data: null,
      };
    }

    const recipeLinks = await productRecipeModel.count({
      where: { stockItemId: item.id },
      transaction,
    });
    if (recipeLinks > 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "This stock item is used by a menu item. Remove it from the menu item first",
        data: null,
      };
    }

    const merged = await stockItemModel.findAll({
      where: { mergedIntoId: item.id },
      transaction,
    });
    if (merged.length) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Undo the sync first so each batch is separate, then delete.",
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "stock_item",
      record: item,
      req,
    });

    await stockHistoryModel.destroy({
      where: { stockItemId: item.id },
      transaction,
    });
    await item.destroy({ transaction });
    await transaction.commit();

    return {
      ...generalConstant.EN.STOCK_ITEM.DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Bulk import stock items from .xlsx/.xls/.csv.
 * Measuring units and suppliers must already exist (matched by name/symbol).
 * Missing stock groups can be created when createMissingGroups is true.
 */
const importFromExcel = async (file, options = {}, req = {}) => {
  const { dryRun = false, createMissingGroups = true } = options;

  let rows;
  let headerMap;
  try {
    ({ rows, headerMap } = readSheet(file.path));
  } catch {
    return {
      status: 400,
      success: false,
      message:
        "That file could not be read. Save it as .xlsx or .csv and try again.",
      data: null,
    };
  }

  const missingColumns = missingRequiredColumns(headerMap);
  if (missingColumns.length) {
    const labels = {
      name: "Name",
      measuringUnit: "Measuring Unit",
    };
    return {
      status: 400,
      success: false,
      message: `Missing required column(s): ${missingColumns
        .map((c) => labels[c] || c)
        .join(", ")}`,
      data: null,
    };
  }

  if (!rows.length) {
    return {
      status: 400,
      success: false,
      message: "The file has no rows to import.",
      data: null,
    };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      status: 400,
      success: false,
      message: `Import up to ${MAX_IMPORT_ROWS} rows at a time — split the file and try again.`,
      data: null,
    };
  }

  const candidates = normalizeRows(rows, headerMap);
  const transaction = await sequelize.transaction();

  try {
    const [units, groups, suppliers, existingItems] = await Promise.all([
      measuringUnitModel.findAll({ transaction }),
      stockGroupModel.findAll({ transaction }),
      supplierModel.findAll({ transaction }),
      stockItemModel.findAll({ attributes: ["name"], transaction }),
    ]);

    const unitByKey = new Map();
    for (const unit of units) {
      unitByKey.set(unit.name.trim().toLowerCase(), unit);
      if (unit.symbol) {
        unitByKey.set(String(unit.symbol).trim().toLowerCase(), unit);
      }
    }

    const groupByName = new Map(
      groups.map((g) => [g.name.trim().toLowerCase(), g]),
    );
    const supplierByName = new Map(
      suppliers.map((s) => [s.name.trim().toLowerCase(), s]),
    );
    const existingNames = new Set(
      existingItems.map((item) => item.name.trim().toLowerCase()),
    );

    const results = [];
    const createdGroups = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    const createdBy = historyCreatedBy();

    for (const candidate of candidates) {
      const errors = [...candidate.errors];

      if (!errors.length && existingNames.has(candidate.name.toLowerCase())) {
        skipped += 1;
        results.push({
          rowNumber: candidate.rowNumber,
          name: candidate.name,
          status: "skipped",
          message: "A stock item with this name already exists",
        });
        continue;
      }

      const unit = candidate.measuringUnit
        ? unitByKey.get(candidate.measuringUnit.toLowerCase())
        : null;
      if (!unit) {
        errors.push(
          candidate.measuringUnit
            ? `Measuring unit "${candidate.measuringUnit}" does not exist`
            : "Measuring unit is required",
        );
      }

      let group = null;
      if (candidate.group) {
        group = groupByName.get(candidate.group.toLowerCase()) || null;
        if (!group && !createMissingGroups) {
          errors.push(`Stock group "${candidate.group}" does not exist`);
        }
      }

      let supplier = null;
      if (candidate.supplier) {
        supplier = supplierByName.get(candidate.supplier.toLowerCase()) || null;
        if (!supplier) {
          errors.push(`Supplier "${candidate.supplier}" does not exist`);
        }
      }

      if (errors.length) {
        failed += 1;
        results.push({
          rowNumber: candidate.rowNumber,
          name: candidate.name,
          status: "failed",
          message: errors.join("; "),
        });
        continue;
      }

      if (candidate.group && !group) {
        const slugBase = slugGenerator(candidate.group);
        let slug = slugBase;
        let count = 1;
        while (await stockGroupModel.findOne({ where: { slug }, transaction })) {
          slug = `${slugBase}-${count}`;
          count += 1;
        }
        group = await stockGroupModel.create(
          {
            name: candidate.group,
            slug,
            description: null,
          },
          { transaction },
        );
        groupByName.set(candidate.group.toLowerCase(), group);
        createdGroups.push(group.name);
      }

      const openingQty = toNumber(candidate.openingQuantity);
      const rate = toNumber(
        candidate.openingRate !== undefined && candidate.openingRate !== null
          ? candidate.openingRate
          : candidate.defaultPrice,
      );
      const price = toNumber(candidate.defaultPrice) || rate;
      const slug = await uniqueSlug(candidate.name, null, transaction);

      const item = await stockItemModel.create(
        {
          name: candidate.name,
          slug,
          measuringUnitId: unit.id,
          stockGroupId: group ? group.id : null,
          supplierId: supplier ? supplier.id : null,
          defaultPrice: price,
          openingQuantity: openingQty,
          quantity: openingQty,
          lowStockThreshold:
            candidate.lowStockThreshold === null ||
            candidate.lowStockThreshold === undefined
              ? null
              : toNumber(candidate.lowStockThreshold),
        },
        { transaction },
      );

      await stockHistoryModel.create(
        {
          stockItemId: item.id,
          type: "opening",
          quantity: openingQty,
          rate,
          value: openingQty * rate,
          note: "Opening stock (bulk import)",
          supplierSplit:
            openingQty > 0
              ? [{ supplierId: supplier ? supplier.id : null, quantity: openingQty }]
              : null,
          createdBy,
        },
        { transaction },
      );
      if (openingQty > 0) {
        await addSupplierQty(
          item.id,
          supplier ? supplier.id : null,
          openingQty,
          transaction,
        );
      }

      existingNames.add(candidate.name.toLowerCase());
      created += 1;
      results.push({
        rowNumber: candidate.rowNumber,
        name: candidate.name,
        status: dryRun ? "ready" : "created",
        message: dryRun ? "Ready to import" : "Imported",
      });
    }

    if (dryRun) {
      await transaction.rollback();
    } else {
      await transaction.commit();
    }

    return {
      status: 200,
      success: true,
      message: dryRun
        ? `${created} item(s) ready to import`
        : `${created} item(s) imported successfully`,
      data: {
        dryRun,
        totalRows: candidates.length,
        created,
        skipped,
        failed,
        createdGroups: dryRun ? [] : createdGroups,
        rows: results,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  adjust,
  summary,
  deleteById,
  importFromExcel,
  syncSameName,
  undoSyncSameName,
};
