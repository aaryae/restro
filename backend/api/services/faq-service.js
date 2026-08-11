const { faqModel } = require("../../models");
const { Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  try {
    const faq = await faqModel.create(req.body);
    if (!faq) {
      return {
        ...generalConstant.EN.FAQ.CREATE_FAQ_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.FAQ.CREATE_FAQ_SUCCESS,
      data: faq,
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

    const result = await paginate(faqModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.FAQ.FAQ_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.FAQ.FAQ_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const faq = await faqModel.findByPk(+req.params.id);
    if (!faq) {
      return {
        ...generalConstant.EN.FAQ.FAQ_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.FAQ.FAQ_GET_SUCCESS,
      data: faq,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const faq = await faqModel.findByPk(+req.params.id);
    if (!faq) {
      return {
        ...generalConstant.EN.FAQ.FAQ_NOT_FOUND,
        data: null,
      };
    }

    const updated = await faq.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.FAQ.UPDATE_FAQ_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.FAQ.UPDATE_FAQ_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const updateByOrder = async (req) => {
  try {
    const faqs = req.body; // Expecting an array of { id, order }

    if (!Array.isArray(faqs) || faqs.length === 0) {
      return {
        ...generalConstant.EN.FAQ.INVALID_INPUT,
        data: null,
      };
    }

    // Validate that each object has both id and order
    for (const faq of faqs) {
      if (!faq.id || faq.order === undefined) {
        return {
          ...generalConstant.EN.FAQ.INVALID_INPUT,
          data: null,
        };
      }
    }

    // Use a transaction to ensure atomicity
    const transaction = await faqModel.sequelize.transaction();

    try {
      // Perform bulk updates using `Promise.all`
      await Promise.all(
        faqs.map(({ id, order }) =>
          faqModel.update({ order }, { where: { id }, transaction }),
        ),
      );

      await transaction.commit();

      return {
        ...generalConstant.EN.FAQ.UPDATE_FAQ_SUCCESS,
        data: faqs, // Return updated FAQs
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating FAQ orders:", error);
    return {
      ...generalConstant.EN.FAQ.UPDATE_FAQ_FAILURE,
      data: null,
      error: error.message,
    };
  }
};

const deleteById = async (req) => {
  try {
    const faq = await faqModel.findByPk(+req.params.id);
    if (!faq) {
      return {
        ...generalConstant.EN.FAQ.FAQ_NOT_FOUND,
        data: null,
      };
    }

    const deleted = await faq.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.FAQ.FAQ_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.FAQ.FAQ_DELETE_SUCCESS,
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
  updateByOrder,
  deleteById,
};
