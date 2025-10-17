const { addonModel, productModel } = require("../../models");
const paginate = require("../../utils/paginate");
const generalConstant = require("../../constants/general-constant");
const { Op } = require("sequelize");

const create = async (req) => {
  try {
    const addon = await addonModel.create(req.body);

    if (!addon) {
      return {
        ...generalConstant.EN.ADDON.CREATE_ADDON_FAILURE,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.ADDON.CREATE_ADDON_SUCCESS,
      data: addon,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, search } = req.query;
    const filters = {};

    if (search) {
      filters.name = { [Op.like]: `%${search}%` };
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
    const addon = await addonModel.findByPk(id);

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
  try {
    const result = await addonModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Addon Not Found`,
        data: null,
      };
    }

    const updatedAddon = await result.update(req.body);
    if (!updatedAddon) {
      return {
        status: 500,
        success: false,
        message: `Addon updated Failed`,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.ADDON.UPDATE_ADDON_SUCCESS,
      data: updatedAddon,
    };
  } catch (error) {
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
      include: [
        {
          model: productModel,
          as: "products",
          required: false,
          attributes: [],
        },
      ],
      group: ["addon.id"],
      having: sequelize.literal("COUNT(products.id) = 0"),
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
