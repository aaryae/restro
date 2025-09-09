const generalConstant = require("../../constants/general-constant");
const { productModel, productMediaModel, sequelize } = require("../../models");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");
// REDIS EXCLUSION
// const redis = require("../../configs/redis");
const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    req.body.slug = slugGenerator(req.body.name);
    const product = await productModel.create(req.body, {
      transaction,
    });
    console.log(product);
    await product.update(
      {
        order: product?.id,
      },
      { transaction },
    );

    const mediaArr = req.body.mediaArr;
    if (mediaArr?.length > 0) {
      const bulkMedia = mediaArr?.map((each) => {
        return {
          imageUrl: each,
          productId: product.id,
        };
      });

      await productMediaModel.bulkCreate(bulkMedia, {
        transaction,
      });
    }

    if (!product) {
      return {
        ...generalConstant.EN.PRODUCT.CREATE_PRODUCT_FAILURE,
        data: null,
      };
    }

    await transaction.commit();
    return {
      ...generalConstant.EN.PRODUCT.CREATE_PRODUCT_SUCCESS,
      data: product,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug, category } = req.query;
    const filters = category ? { productCategoryId: category } : {};
    const include = [{ model: productMediaModel, as: "mediaArr" }];

    if (slug) {
      filters.slug = {
        [Op.like]: `%${slug}%`,
      };
    }
    const order = [["order", "ASC"]];

    const result = await paginate(productModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    if (!result) {
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_LIST_FAILURE,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.PRODUCT.PRODUCT_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const product = await productModel.findByPk(+req.params.id, {
      include: [{ model: productMediaModel, as: "mediaArr" }],
    });
    if (!product) {
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_NOT_FOUND,
        data: null,
      };
    }
    // REDIS EXCLUSION
    // const getData = await redis.get(`product:${req.params.id}:reserved`);
    // const quantity = +getData;

    // product.reservedQuantity = quantity;
    return {
      ...generalConstant.EN.PRODUCT.PRODUCT_GET_SUCCESS,
      data: product,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const product = await productModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!product) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_NOT_FOUND,
        data: null,
      };
    }

    const { mediaArr, ...productData } = req.body;

    // REDIS EXCLUSION
    // const getData = await redis.get(`product:${req.params.id}:reserved`);
    // const quantity = +getData;
    // const minQuanToDec = 1 + quantity;
    // if (productData?.quantity <= getData) {
    //   return {
    //     ...generalConstant.EN.PRODUCT.UPDATE_PRODUCT_QUANTITY_FAILURE,
    //     message: `Sorry you cannot decrease the quantity lest than  ${minQuanToDec} because it is lock`,
    //     data: null,
    //   };
    // }
    // console.log(+getData);

    const updated = await product.update(productData, { transaction });

    if (Array.isArray(mediaArr)) {
      await productMediaModel.destroy({
        where: { productId: product.id },
        transaction,
      });

      const bulkMedia = mediaArr.map((imageUrl) => ({
        imageUrl,
        productId: product.id,
      }));

      await productMediaModel.bulkCreate(bulkMedia, { transaction });
    }

    await transaction.commit();

    if (!updated) {
      return {
        ...generalConstant.EN.PRODUCT.UPDATE_PRODUCT_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT.UPDATE_PRODUCT_SUCCESS,
      data: updated,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const product = await productModel.findByPk(+req.params.id);
    if (!product) {
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_NOT_FOUND,
        data: null,
      };
    }
    // REDIS EXCLUSION
    // const getData = await redis.get(`product:${req.params.id}:reserved`);
    // const quantity = +getData;
    // if (quantity) {
    //   return {
    //     status: 200,
    //     message: `You cannot delete this product because ${quantity} quantity is still lock by user`,
    //   };
    // }
    const deleted = await product.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT.PRODUCT_DELETE_SUCCESS,
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
        productModel.update({ order }, { where: { id }, transaction }),
      ),
    );

    await transaction.commit();
    return {
      status: 200,
      message: "Product Order update successfully",
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
  updateByOrder,
};
