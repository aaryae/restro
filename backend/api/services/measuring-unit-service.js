const { Op } = require("sequelize");
const {
  measuringUnitModel,
  stockItemModel,
  stockItemUnitModel,
  productRecipeModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");
const {
  ensureDefaultMeasuringUnits,
} = require("../../lib/seed-default-measuring-units");

const equalsInclude = {
  model: measuringUnitModel,
  as: "equalsUnit",
  attributes: ["id", "name", "symbol"],
};

const relationUpdates = async (body, unitId, transaction) => {
  if (
    body.equalsUnitId === undefined &&
    body.equalsFactor === undefined &&
    body.equalsCount === undefined
  ) {
    return {};
  }
  const equalsUnitId = body.equalsUnitId ? Number(body.equalsUnitId) : null;
  const equalsFactor =
    body.equalsFactor === null || body.equalsFactor === undefined
      ? null
      : Number(body.equalsFactor);
  const equalsCount =
    body.equalsCount === null || body.equalsCount === undefined
      ? null
      : Number(body.equalsCount);
  if (!equalsUnitId) {
    return { equalsUnitId: null, equalsFactor: null, equalsCount: null };
  }
  if (!(equalsFactor > 0) || !(equalsCount > 0)) {
    const error = new Error("Enter the amount on both sides of the relation");
    error.status = 400;
    throw error;
  }
  if (unitId && equalsUnitId === Number(unitId)) {
    const error = new Error("A unit cannot equal itself");
    error.status = 400;
    throw error;
  }
  const seen = new Set(unitId ? [Number(unitId)] : []);
  let cursor = equalsUnitId;
  while (cursor) {
    if (seen.has(cursor)) {
      const error = new Error("That relation loops back to this unit");
      error.status = 400;
      throw error;
    }
    seen.add(cursor);
    const next = await measuringUnitModel.findByPk(cursor, {
      attributes: ["id", "equalsUnitId"],
      transaction,
    });
    if (!next) {
      const error = new Error("Related measuring unit not found");
      error.status = 400;
      throw error;
    }
    cursor = next.equalsUnitId ? Number(next.equalsUnitId) : 0;
  }
  return { equalsUnitId, equalsFactor, equalsCount };
};

const uniqueSlug = async (name, excludeId = null) => {
  const slugBase = slugGenerator(name);
  let slug = slugBase;
  let count = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await measuringUnitModel.findOne({ where });
    if (!existing) return slug;
    slug = `${slugBase}-${count}`;
    count += 1;
  }
};

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, symbol, description } = req.body;
    const relation = await relationUpdates(req.body, null, transaction);
    const slug = await uniqueSlug(name);
    const unit = await measuringUnitModel.create(
      {
        name,
        symbol,
        slug,
        description: description || null,
        ...relation,
      },
      { transaction },
    );
    await transaction.commit();
    return {
      ...generalConstant.EN.MEASURING_UNIT.CREATE_SUCCESS,
      data: unit,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    if (error.status) {
      return { status: error.status, success: false, message: error.message, data: null };
    }
    throw error;
  }
};

const list = async (req) => {
  try {
    // Existing cafes get restaurant defaults the first time they open Units.
    await ensureDefaultMeasuringUnits(sequelize, { measuringUnitModel });

    const { limit, page, name, symbol } = req.query;
    const filters = {};
    if (name) filters.name = { [Op.iLike]: `%${name}%` };
    if (symbol) filters.symbol = { [Op.iLike]: `%${symbol}%` };

    const result = await paginate(measuringUnitModel, {
      limit,
      page,
      filters,
      include: [equalsInclude],
      order: [
        ["name", "ASC"],
        ["id", "ASC"],
      ],
    });

    return {
      ...generalConstant.EN.MEASURING_UNIT.LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const unit = await measuringUnitModel.findByPk(+req.params.id, {
      include: [equalsInclude],
    });
    if (!unit) {
      return {
        ...generalConstant.EN.MEASURING_UNIT.NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.MEASURING_UNIT.GET_SUCCESS,
      data: unit,
    };
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const unit = await measuringUnitModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!unit) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.MEASURING_UNIT.NOT_FOUND,
        data: null,
      };
    }

    const { name, symbol, description } = req.body;
    const updates = {};
    if (name && name !== unit.name) {
      updates.name = name;
      updates.slug = await uniqueSlug(name, unit.id);
    }
    if (symbol) updates.symbol = symbol;
    if (description !== undefined) {
      updates.description = description || null;
    }
    Object.assign(updates, await relationUpdates(req.body, unit.id, transaction));

    await unit.update(updates, { transaction });
    await transaction.commit();
    const fresh = await measuringUnitModel.findByPk(unit.id, {
      include: [equalsInclude],
    });
    return {
      ...generalConstant.EN.MEASURING_UNIT.UPDATE_SUCCESS,
      data: fresh,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    if (error.status) {
      return { status: error.status, success: false, message: error.message, data: null };
    }
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const unit = await measuringUnitModel.findByPk(+req.params.id);
    if (!unit) {
      return {
        ...generalConstant.EN.MEASURING_UNIT.NOT_FOUND,
        data: null,
      };
    }

    const [linked, packLinks, recipeLinks, equalLinks] = await Promise.all([
      stockItemModel.count({ where: { measuringUnitId: unit.id } }),
      stockItemUnitModel.count({
        where: {
          [Op.or]: [{ measuringUnitId: unit.id }, { ofUnitId: unit.id }],
        },
      }),
      productRecipeModel.count({ where: { measuringUnitId: unit.id } }),
      measuringUnitModel.count({ where: { equalsUnitId: unit.id } }),
    ]);
    if (linked > 0 || packLinks > 0 || recipeLinks > 0 || equalLinks > 0) {
      return {
        ...generalConstant.EN.MEASURING_UNIT.IN_USE,
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "measuring_unit",
      record: unit,
      req,
    });
    await unit.destroy();

    return {
      ...generalConstant.EN.MEASURING_UNIT.DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { create, list, getById, update, deleteById };
