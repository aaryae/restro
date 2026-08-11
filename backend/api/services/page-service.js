const { pageModel } = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

const create = async (req) => {
  try {
    let { ...rest } = req.body;
    rest.slug = slugGenerator(rest?.title);

    const isUsedSlug = await pageModel.findOne({
      where: {
        slug: rest.slug,
      },
    });
    if (isUsedSlug) {
      return {
        ...generalConstant.EN.PAGE.SLUG_ALREADY_USED,
        data: null,
      };
    }
    const result = await pageModel.create(rest);

    if (!result) {
      return {
        ...generalConstant.EN.PAGE.CREATE_PAGE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PAGE.CREATE_PAGE_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug } = req.query;
    const filters = {};
    const include = [];

    if (slug) {
      filters.slug = {
        [Op.iLike]: `%${slug}%`,
      };
    }

    const result = await paginate(pageModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.PAGE.PAGE_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PAGE.PAGE_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await pageModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.PAGE.PAGE_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PAGE.PAGE_FOUND,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const result = await pageModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.PAGE.PAGE_NOT_FOUND,
        data: null,
      };
    }

    const updated = await result.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.PAGE.UPDATE_PAGE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PAGE.UPDATE_PAGE_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await pageModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.PAGE.PAGE_NOT_FOUND,
        data: null,
      };
    }

    const deleted = await result.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.PAGE.PAGE_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PAGE.PAGE_DELETE_SUCCESS,
      data: null,
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
};
