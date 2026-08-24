const {
  purchaseCategoryModel,
  purchaseItemModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const { Sequelize } = require("sequelize");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, description } = req.body;

    // Check for duplicate name
    const existingCategory = await purchaseCategoryModel.findOne({
      where: { name },
      transaction,
    });
    if (existingCategory) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Purchase category name already exists",
        data: null,
      };
    }

    const category = await purchaseCategoryModel.create(
      {
        name,
        description,
        isActive: true,
      },
      { transaction },
    );

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE_CATEGORY.CREATE_CATEGORY_SUCCESS,
      data: category,
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
    if (name) {
      filters.name = { [Sequelize.Op.iLike]: `%${name}%` };
    }
    const order = [["createdAt", "DESC"], ["id", "DESC"]];

    const result = await paginate(purchaseCategoryModel, {
      limit,
      page,
      filters,
      order,
    });

    if (!result) {
      return {
        ...generalConstant.EN.PURCHASE_CATEGORY.CATEGORY_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PURCHASE_CATEGORY.CATEGORY_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const category = await purchaseCategoryModel.findByPk(+req.params.id);
    if (!category) {
      return {
        ...generalConstant.EN.PURCHASE_CATEGORY.CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PURCHASE_CATEGORY.CATEGORY_GET_SUCCESS,
      data: category,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await purchaseCategoryModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!category) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PURCHASE_CATEGORY.CATEGORY_NOT_FOUND,
        data: null,
      };
    }

    const { name, description } = req.body;
    if (name) {
      const existingCategory = await purchaseCategoryModel.findOne({
        where: { name, id: { [Sequelize.Op.ne]: category.id } },
        transaction,
      });
      if (existingCategory) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Purchase category name already exists",
          data: null,
        };
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await category.update(updateData, { transaction });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE_CATEGORY.UPDATE_CATEGORY_SUCCESS,
      data: category,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await purchaseCategoryModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!category) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PURCHASE_CATEGORY.CATEGORY_NOT_FOUND,
        data: null,
      };
    }

    // Check if category is used in PurchaseItem
    const usedInItems = await purchaseItemModel.findOne({
      where: { categoryId: category.id },
      transaction,
    });
    if (usedInItems) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Cannot delete category in use by purchase items",
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "purchase_category",
      record: category,
      req,
      transaction,
    });
    await category.destroy({ transaction });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE_CATEGORY.DELETE_CATEGORY_SUCCESS,
      data: null,
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
  updateById,
  deleteById,
};
