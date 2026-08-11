const { where, Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const {
  productCategoryModel,
  productModel,
  sequelize,
} = require("../../models");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

const create = async (req) => {
  try {
    req.body.slug = slugGenerator(req.body.name);
    const productCategory = await productCategoryModel.create(req.body);
    await productCategory.update({
      order: productCategory?.id,
    });

    if (!productCategory) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.CREATE_PRODUCT_CATEGORY_FAILURE,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.PRODUCT_CATEGORY.CREATE_PRODUCT_CATEGORY_SUCCESS,
      data: productCategory,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, name } = req.query;
    const filters = {};
    const include = [];
    const order = [["order", "ASC"]];

    if (name) {
      filters.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    const result = await paginate(productCategoryModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    if (!result) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_LIST_FAILURE,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const productCategory = await productCategoryModel.findByPk(+req.params.id);
    if (!productCategory) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_GET_SUCCESS,
      data: productCategory,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const productCategory = await productCategoryModel.findByPk(+req.params.id);
    if (!productCategory) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    req.body.slug = slugGenerator(req.body.name);

    const updated = await productCategory.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.UPDATE_PRODUCT_CATEGORY_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT_CATEGORY.UPDATE_PRODUCT_CATEGORY_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const productCategory = await productCategoryModel.findByPk(+req.params.id);
    if (!productCategory) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    const isUsedProduct = await productModel.findOne({
      where: {
        productCategoryId: productCategory.id,
      },
    });
    if (isUsedProduct) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_USED,
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "product_category",
      record: productCategory,
      req,
    });
    const deleted = await productCategory.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT_CATEGORY.PRODUCT_CATEGORY_DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const updateByOrder = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { orders } = req.body;
    await Promise.all(
      orders.map(({ id, order }) =>
        productCategoryModel.update({ order }, { where: { id }, transaction }),
      ),
    );
    await transaction.commit();
    return {
      status: 200,
      message: "Product Categories Order update successfully",
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
  updateByOrder,
  updateById,
  deleteById,
};
