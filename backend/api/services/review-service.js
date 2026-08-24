const { reviewModel } = require("../../models");
const { Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  try {
    const result = await reviewModel.create(req.body);
    if (!result) {
      return {
        ...generalConstant.EN.REVIEW.CREATE_REVIEW_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.REVIEW.CREATE_REVIEW_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page } = req.query;
    const filters = {};
    const include = [];

    // if (pageName) {
    //   filters.pageName = {
    //     [Op.like]: `%${pageName}%`,
    //   };
    // }

    const result = await paginate(reviewModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.REVIEW.REVIEW_GET_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.REVIEW.REVIEW_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await reviewModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.REVIEW.REVIEW_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.REVIEW.REVIEW_FOUND,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const result = await reviewModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.REVIEW.REVIEW_NOT_FOUND,
        data: null,
      };
    }

    const updated = await result.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.REVIEW.UPDATE_REVIEW_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.REVIEW.UPDATE_REVIEW_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await reviewModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.REVIEW.REVIEW_NOT_FOUND,
        data: null,
      };
    }

    const deleted = await result.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.REVIEW.REVIEW_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.REVIEW.REVIEW_DELETE_SUCCESS,
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
