const generalConstant = require("../../constants/general-constant");
const bulkUploadHelper = require("../../helpers/bulk-upload-helper");
const {
  productVariantModel,
  productVariantMediaModel,
  sequelize,
} = require("../../models");
const paginate = require("../../utils/paginate");
const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const productVariant = await productVariantModel.create(req.body, {
      transaction,
    });

    const mediaArr = req.body.mediaArr;

    const bulkMedia = bulkUploadHelper(mediaArr, productVariant.id);

    await productVariantMediaModel.bulkCreate(bulkMedia, {
      transaction,
    });

    if (!productVariant) {
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.CREATE_PRODUCT_VARIANT_FAILURE,
        data: null,
      };
    }
    await transaction.commit();
    return {
      ...generalConstant.EN.PRODUCT_VARIANT.CREATE_PRODUCT_VARIANT_SUCCESS,
      data: productVariant,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page } = req.query;
    const filters = {};
    const include = [];
    const result = await paginate(productVariantModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_LIST_FAILURE,
        data: null,
      };
    }

    return {
      ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const productVariant = await productVariantModel.findByPk(+req.params.id, {
      include: [
        { model: productVariantMediaModel, as: "product_variant_media" },
      ],
    });
    if (!productVariant) {
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT.PRODUCT_GET_SUCCESS,
      data: productVariant,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const productVariant = await productVariantModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!productVariant) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_NOT_FOUND,
        data: null,
      };
    }

    const { mediaArr, ...productVariantData } = req.body;

    const updated = await productVariant.update(productVariantData, {
      transaction,
    });

    if (Array.isArray(mediaArr)) {
      await productVariantMediaModel.destroy({
        where: { productVariantId: productVariant.id },
      });

      const bulkMedia = mediaArr.map((imageUrl) => ({
        imageUrl,
        productVariantId: productVariant.id,
      }));

      await productVariantMediaModel.bulkCreate(bulkMedia, { transaction });
    }

    await transaction.commit();

    if (!updated) {
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.UPDATE_PRODUCT_VARIANT_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT_VARIANT.UPDATE_PRODUCT_VARIANT_SUCCESS,
      data: updated,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const productVariant = await productVariantModel.findByPk(+req.params.id);
    if (!productVariant) {
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_NOT_FOUND,
        data: null,
      };
    }

    const deleted = await productVariant.destroy();
    if (!deleted) {
      return {
        ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_DELETE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PRODUCT_VARIANT.PRODUCT_VARIANT_DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { create, list, getById, updateById, deleteById };
