const { Op } = require("sequelize");
const {
  stockItemModel,
  stockHistoryModel,
  measuringUnitModel,
  stockGroupModel,
  supplierModel,
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

const MAX_IMPORT_ROWS = 2000;

const INBOUND_TYPES = new Set(["opening", "purchase", "adjustment_in"]);
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
];

const toNumber = (value) => Number(value || 0);

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

    const rate = toNumber(
      openingRate !== undefined ? openingRate : defaultPrice,
    );
    const openingQty = toNumber(openingQuantity);
    const price = toNumber(defaultPrice);
    const slug = await uniqueSlug(name, null, transaction);

    const item = await stockItemModel.create(
      {
        name,
        slug,
        measuringUnitId,
        stockGroupId: stockGroupId || null,
        supplierId: supplierId || null,
        defaultPrice: price,
        openingQuantity: openingQty,
        quantity: openingQty,
        lowStockThreshold:
          lowStockThreshold === undefined || lowStockThreshold === null
            ? null
            : toNumber(lowStockThreshold),
      },
      { transaction },
    );

    const createdBy = historyCreatedBy();

    await stockHistoryModel.create(
      {
        stockItemId: item.id,
        type: "opening",
        quantity: openingQty,
        rate,
        value: openingQty * rate,
        note: "Opening stock",
        createdBy,
      },
      { transaction },
    );

    await transaction.commit();

    const full = await stockItemModel.findByPk(item.id, {
      include: itemIncludes,
    });

    return {
      ...generalConstant.EN.STOCK_ITEM.CREATE_SUCCESS,
      data: full,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, name, stockGroupId, supplierId } = req.query;
    const filters = {};
    if (name) filters.name = { [Op.iLike]: `%${name}%` };
    if (stockGroupId) filters.stockGroupId = +stockGroupId;
    if (supplierId) filters.supplierId = +supplierId;

    const result = await paginate(stockItemModel, {
      limit,
      page,
      filters,
      include: itemIncludes,
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });

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
      data: item,
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
    } = req.body;

    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = await uniqueSlug(name, item.id, transaction);
    }
    if (measuringUnitId) updates.measuringUnitId = measuringUnitId;
    if (stockGroupId !== undefined) updates.stockGroupId = stockGroupId || null;
    if (supplierId !== undefined) updates.supplierId = supplierId || null;
    if (defaultPrice !== undefined) updates.defaultPrice = toNumber(defaultPrice);
    if (lowStockThreshold !== undefined) {
      updates.lowStockThreshold =
        lowStockThreshold === null ? null : toNumber(lowStockThreshold);
    }

    await item.update(updates, { transaction });
    await transaction.commit();

    const full = await stockItemModel.findByPk(item.id, {
      include: itemIncludes,
    });

    return {
      ...generalConstant.EN.STOCK_ITEM.UPDATE_SUCCESS,
      data: full,
    };
  } catch (error) {
    await transaction.rollback();
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

    const { type, quantity, rate, note } = req.body;
    const qty = toNumber(quantity);
    const applyRate =
      rate !== undefined && rate !== null
        ? toNumber(rate)
        : toNumber(item.defaultPrice);
    const currentQty = toNumber(item.quantity);

    let nextQty = currentQty;
    if (INBOUND_TYPES.has(type)) {
      nextQty = currentQty + qty;
    } else if (OUTBOUND_TYPES.has(type)) {
      if (qty > currentQty) {
        await transaction.rollback();
        return {
          ...generalConstant.EN.STOCK_ITEM.INSUFFICIENT_STOCK,
          data: null,
        };
      }
      nextQty = currentQty - qty;
    }

    await item.update({ quantity: nextQty }, { transaction });

    const createdBy = historyCreatedBy();

    const history = await stockHistoryModel.create(
      {
        stockItemId: item.id,
        type,
        quantity: qty,
        rate: applyRate,
        value: qty * applyRate,
        note: note || null,
        createdBy,
      },
      { transaction },
    );

    await transaction.commit();

    const full = await stockItemModel.findByPk(item.id, {
      include: itemIncludes,
    });

    return {
      ...generalConstant.EN.STOCK_ITEM.ADJUST_SUCCESS,
      data: { item: full, history },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const summary = async () => {
  try {
    const items = await stockItemModel.findAll({
      attributes: ["id", "quantity", "defaultPrice", "lowStockThreshold"],
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
          createdBy,
        },
        { transaction },
      );

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
};
