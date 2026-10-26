const {
  addonModel,
  addonRecipeModel,
  stockItemModel,
  measuringUnitModel,
  productModel,
  sequelize,
} = require("../../models");
const paginate = require("../../utils/paginate");
const generalConstant = require("../../constants/general-constant");
const { Op } = require("sequelize");
const { replaceAddonRecipes } = require("../../lib/product-recipes");
const { UnitChainError } = require("../../lib/unit-quantity");

const recipeInclude = {
  model: addonRecipeModel,
  as: "recipes",
  include: [
    {
      model: stockItemModel,
      as: "stockItem",
      attributes: ["id", "name"],
    },
    {
      model: measuringUnitModel,
      as: "measuringUnit",
      attributes: ["id", "name", "symbol"],
    },
  ],
};

const recipeError = (error) => {
  if (error instanceof UnitChainError) return error.toResponse();
  return null;
};

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { recipes, ...addonData } = req.body;
    const addon = await addonModel.create(addonData, { transaction });
    await replaceAddonRecipes(addon.id, recipes, transaction);
    await transaction.commit();

    const full = await addonModel.findByPk(addon.id, { include: [recipeInclude] });
    return {
      ...generalConstant.EN.ADDON.CREATE_ADDON_SUCCESS,
      data: full,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    const response = recipeError(error);
    if (response) return response;
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, search } = req.query;
    const filters = {};

    if (search) {
      filters.name = { [Op.iLike]: `%${search}%` };
    }

    const result = await paginate(addonModel, {
      limit,
      page,
      filters,
      order: [["createdAt", "DESC"]],
    });

    if (!result) {
      return {
        ...generalConstant.EN.ADDON.LIST_ADDON_FAILURE,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.ADDON.LIST_ADDON_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const { id } = req.params;
    const addon = await addonModel.findByPk(id, { include: [recipeInclude] });

    if (!addon) {
      return {
        ...generalConstant.EN.ADDON.ADDON_NOT_FOUND,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.ADDON.GET_ADDON_SUCCESS,
      data: addon,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const result = await addonModel.findByPk(+req.params.id, { transaction });
    if (!result) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: `Addon Not Found`,
        data: null,
      };
    }

    const { recipes, ...addonData } = req.body;
    await result.update(addonData, { transaction });
    await replaceAddonRecipes(result.id, recipes, transaction);
    await transaction.commit();

    const full = await addonModel.findByPk(result.id, { include: [recipeInclude] });
    return {
      ...generalConstant.EN.ADDON.UPDATE_ADDON_SUCCESS,
      data: full,
    };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    const response = recipeError(error);
    if (response) return response;
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const { id } = req.params;
    const addon = await addonModel.findByPk(id, {
      include: [
        {
          model: productModel,
          as: "products",
          required: false,
          attributes: [],
        },
      ],
    });

    if (!addon) {
      return {
        ...generalConstant.EN.ADDON.ADDON_NOT_FOUND,
        data: null,
      };
    }

    // Check if addon is being used by any product
    const productCount = await addon.countProducts();
    if (productCount > 0) {
      return {
        ...generalConstant.EN.ADDON.ADDON_IN_USE,
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({ resourceType: "addon", record: addon, req });
    await addon.destroy();
    return {
      ...generalConstant.EN.ADDON.DELETE_ADDON_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const getUnusedAddons = async (req) => {
  try {
    const addons = await addonModel.findAll({
      where: {
        id: {
          [Op.notIn]: sequelize.literal(
            `(SELECT DISTINCT "addonId" FROM "products_addons" WHERE "addonId" IS NOT NULL)`,
          ),
        },
      },
    });

    return {
      ...generalConstant.EN.ADDON.LIST_UNUSED_ADDON_SUCCESS,
      data: addons,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  updateById,
  deleteById,
  getUnusedAddons,
};
