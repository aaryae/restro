const {
  expenseCategoryModel,
  expenseModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const { Op } = require("sequelize");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, description, isActive } = req.body;

    // Check for duplicate name
    const existingCategory = await expenseCategoryModel.findOne({
      where: { name },
      transaction,
    });
    if (existingCategory) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        data: null,
      };
    }

    const category = await expenseCategoryModel.create(
      {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
      },
      { transaction },
    );

    await transaction.commit();
    return {
      ...generalConstant.EN.EXPENSE_CATEGORY.CREATE_EXPENSE_CATEGORY_SUCCESS,
      data: category,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, isActive, name } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (name) {
      filters.name = { [Op.iLike]: `%${name}%` };
    }

    const result = await paginate(expenseCategoryModel, {
      limit,
      page,
      filters,
      order: [["name", "ASC"]],
    });

    if (!result) {
      return {
        ...generalConstant.EN.EXPENSE_CATEGORY.EXPENSE_CATEGORY_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.EXPENSE_CATEGORY.EXPENSE_CATEGORY_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const category = await expenseCategoryModel.findByPk(+req.params.id);
    if (!category) {
      return {
        ...generalConstant.EN.EXPENSE_CATEGORY.EXPENSE_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.EXPENSE_CATEGORY.EXPENSE_CATEGORY_GET_SUCCESS,
      data: category,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const category = await expenseCategoryModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!category) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.EXPENSE_CATEGORY.EXPENSE_CATEGORY_NOT_FOUND,
        data: null,
      };
    }

    const { name, description, isActive } = req.body;
    if (name && name !== category.name) {
      const existingCategory = await expenseCategoryModel.findOne({
        where: { name },
        transaction,
      });
      if (existingCategory) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          data: null,
          message: "Expense category name already exists",
        };
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await category.update(updateData, { transaction });

    await transaction.commit();
    return {
      ...generalConstant.EN.EXPENSE_CATEGORY.UPDATE_EXPENSE_CATEGORY_SUCCESS,
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
    const category = await expenseCategoryModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!category) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.EXPENSE_CATEGORY.EXPENSE_CATEGORY_NOT_FOUND,
        data: null,
      };
    }

    // Check if category is used by any expenses
    const expenseCount = await expenseModel.count({
      where: { categoryId: category.id },
      transaction,
    });
    if (expenseCount > 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        data: null,
        message: "Expense category is used by some expenses",
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "expense_category",
      record: category,
      req,
      transaction,
    });
    await category.destroy({ transaction });

    await transaction.commit();
    return {
      ...generalConstant.EN.EXPENSE_CATEGORY.DELETE_EXPENSE_CATEGORY_SUCCESS,
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
