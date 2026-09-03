const { Op } = require("sequelize");
const {
  measuringUnitModel,
  stockItemModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");
const {
  ensureDefaultMeasuringUnits,
} = require("../../lib/seed-default-measuring-units");

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
    const slug = await uniqueSlug(name);
    const unit = await measuringUnitModel.create(
      {
        name,
        symbol,
        slug,
        description: description || null,
      },
      { transaction },
    );
    await transaction.commit();
    return {
      ...generalConstant.EN.MEASURING_UNIT.CREATE_SUCCESS,
      data: unit,
    };
  } catch (error) {
    await transaction.rollback();
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
    const unit = await measuringUnitModel.findByPk(+req.params.id);
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
    if (name) {
      updates.name = name;
      updates.slug = await uniqueSlug(name, unit.id);
    }
    if (symbol) updates.symbol = symbol;
    if (description !== undefined) {
      updates.description = description || null;
    }

    await unit.update(updates, { transaction });
    await transaction.commit();
    return {
      ...generalConstant.EN.MEASURING_UNIT.UPDATE_SUCCESS,
      data: unit,
    };
  } catch (error) {
    await transaction.rollback();
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

    const linked = await stockItemModel.count({
      where: { measuringUnitId: unit.id },
    });
    if (linked > 0) {
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
