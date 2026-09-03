const { Op } = require("sequelize");
const {
  stockGroupModel,
  stockItemModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

const uniqueSlug = async (name, excludeId = null) => {
  const slugBase = slugGenerator(name);
  let slug = slugBase;
  let count = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await stockGroupModel.findOne({ where });
    if (!existing) return slug;
    slug = `${slugBase}-${count}`;
    count += 1;
  }
};

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, description } = req.body;
    const slug = await uniqueSlug(name);
    const group = await stockGroupModel.create(
      {
        name,
        description: description || null,
        slug,
      },
      { transaction },
    );
    await transaction.commit();
    return {
      ...generalConstant.EN.STOCK_GROUP.CREATE_SUCCESS,
      data: group,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, name } = req.query;
    const filters = {};
    if (name) filters.name = { [Op.iLike]: `%${name}%` };

    const result = await paginate(stockGroupModel, {
      limit,
      page,
      filters,
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });

    return {
      ...generalConstant.EN.STOCK_GROUP.LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const group = await stockGroupModel.findByPk(+req.params.id);
    if (!group) {
      return {
        ...generalConstant.EN.STOCK_GROUP.NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.STOCK_GROUP.GET_SUCCESS,
      data: group,
    };
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const group = await stockGroupModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!group) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.STOCK_GROUP.NOT_FOUND,
        data: null,
      };
    }

    const { name, description } = req.body;
    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = await uniqueSlug(name, group.id);
    }
    if (description !== undefined) {
      updates.description = description || null;
    }

    await group.update(updates, { transaction });
    await transaction.commit();
    return {
      ...generalConstant.EN.STOCK_GROUP.UPDATE_SUCCESS,
      data: group,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const group = await stockGroupModel.findByPk(+req.params.id);
    if (!group) {
      return {
        ...generalConstant.EN.STOCK_GROUP.NOT_FOUND,
        data: null,
      };
    }

    const linked = await stockItemModel.count({
      where: { stockGroupId: group.id },
    });
    if (linked > 0) {
      return {
        ...generalConstant.EN.STOCK_GROUP.IN_USE,
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "stock_group",
      record: group,
      req,
    });
    await group.destroy();

    return {
      ...generalConstant.EN.STOCK_GROUP.DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { create, list, getById, update, deleteById };
