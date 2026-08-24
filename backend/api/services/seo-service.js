const { seoModel } = require("../../models");
const { Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  try {
    const seo = await seoModel.create(req.body);
    if (!seo) {
      return {
        ...generalConstant.EN.SEO.CREATE_SEO_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SEO.CREATE_SEO_SUCCESS,
      data: seo,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, pageName } = req.query;
    const filters = {};
    const include = [];

    if (pageName) {
      filters.pageName = {
        [Op.iLike]: `%${pageName}%`,
      };
    }

    const result = await paginate(seoModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.SEO.SEO_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SEO.SEO_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const seo = await seoModel.findByPk(+req.params.id);
    if (!seo) {
      return {
        ...generalConstant.EN.SEO.SEO_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SEO.SEO_GET_SUCCESS,
      data: seo,
    };
  } catch (error) {
    throw new AppError(error.message);
  }
};

const updateById = async (req) => {
  try {
    const seo = await seoModel.findByPk(+req.params.id);
    if (!seo) {
      return {
        ...generalConstant.EN.SEO.SEO_NOT_FOUND,
        data: null,
      };
    }

    const updated = await seo.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.SEO.UPDATE_SEO_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SEO.UPDATE_SEO_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const seo = await seoModel.findByPk(+req.params.id);
    if (!seo) {
      return {
        ...generalConstant.EN.SEO.SEO_NOT_FOUND,
        data: null,
      };
    }

    const deleted = await seo.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.SEO.SEO_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SEO.SEO_DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { create, list, getById, updateById, deleteById };
