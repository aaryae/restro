const { Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const { parseExcel } = require("../../utils/excelParser");
const {
  productModel,
  productMediaModel,
  productVariantModel,
  addonModel,
  sequelize,
} = require("../../models");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");
// const { Op } = require("sequelize");
// REDIS EXCLUSION
// const redis = require("../../configs/redis");
const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    req.body.slug = slugGenerator(req.body.name);
    req.body.hasVariant =
      req.body.hasVariant ||
      (req.body.variants && req.body.variants.length > 0);
    // Ensure product-level quantity is set even if not provided by client
    if (
      typeof req.body.quantity === "undefined" ||
      req.body.quantity === null
    ) {
      req.body.quantity = 0;
    }

    const product = await productModel.create(req.body, { transaction });
    await product.update({ order: product?.id }, { transaction });

    // Handle media uploads
    const mediaArr = req.body.mediaArr;
    if (mediaArr?.length > 0) {
      const bulkMedia = mediaArr.map((each) => ({
        imageUrl: each,
        productId: product.id,
      }));
      await productMediaModel.bulkCreate(bulkMedia, { transaction });
    }

    // Handle variants if any
    const variants = req.body.variants;
    if (req.body.hasVariant && variants?.length > 0) {
      const bulkVariants = variants.map((variant) => ({
        ...variant,
        productId: product.id,
      }));
      await productVariantModel.bulkCreate(bulkVariants, { transaction });
    }

    // Handle addons if any
    if (Array.isArray(req.body.addons) && req.body.addons.length > 0) {
      const validAddons = await addonModel.findAll({
        where: { id: req.body.addons },
        transaction,
      });
      await product.addAddons(validAddons, { transaction });
    }

    if (!product) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PRODUCT.CREATE_PRODUCT_FAILURE,
        data: null,
      };
    }

    // Fetch the created product with all associations
    const createdProduct = await productModel.findByPk(product.id, {
      include: [
        { model: productMediaModel, as: "mediaArr" },
        { model: productVariantModel, as: "variants" },
        { model: addonModel, as: "addons" },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.PRODUCT.CREATE_PRODUCT_SUCCESS,
      data: createdProduct,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug, category, name } = req.query;
    const filters = category ? { productCategoryId: category } : {};
    const include = [
      { model: productMediaModel, as: "mediaArr" },
      { model: addonModel, as: "addons" },
    ];

    if (slug) {
      filters.slug = {
        [Op.like]: `%${slug}%`,
      };
    }
    if (name) {
      filters.name = {
        [Op.like]: `%${name}%`,
      };
    }
    const order = [["order", "ASC"]];

    const result = await paginate(productModel, {
      limit,
      page,
      filters,
      include,
      order,
      distinct: true, // Important for correct count when using includes with many-to-many
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
      include: [
        { model: productMediaModel, as: "mediaArr" },
        { model: productVariantModel, as: "variants" },
        {
          model: addonModel,
          as: "addons",
          through: { attributes: [] }, // Exclude the join table attributes
        },
      ],
    });

    if (!product) {
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_NOT_FOUND,
        data: null,
      };
    }

    // Transform the response to include addons at the same level as variants
    const responseData = {
      ...product.get({ plain: true }),
      addons: product.addons || [],
    };

    return {
      ...generalConstant.EN.PRODUCT.PRODUCT_GET_SUCCESS,
      data: responseData,
    };
  } catch (error) {
    console.error("Error in getById:", error);
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const product = await productModel.findByPk(+req.params.id, {
      include: [
        { model: addonModel, as: "addons" },
        { model: productMediaModel, as: "mediaArr" },
        { model: productVariantModel, as: "variants" },
      ],
      transaction,
    });
    if (!product) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_NOT_FOUND,
        data: null,
      };
    }

    const { mediaArr, variants, addons, ...productData } = req.body;

    // Update product data
    const updated = await product.update(productData, { transaction });
    if (!updated) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PRODUCT.UPDATE_PRODUCT_FAILURE,
        data: null,
      };
    }

    // Handle media updates
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

    // Handle variants
    if (
      productData.hasVariant &&
      Array.isArray(variants) &&
      variants.length > 0
    ) {
      await productVariantModel.destroy({
        where: { productId: product.id },
        transaction,
      });

      const bulkVariants = variants.map((variant) => ({
        ...variant,
        productId: product.id,
      }));

      await productVariantModel.bulkCreate(bulkVariants, { transaction });
    } else {
      await productVariantModel.destroy({
        where: { productId: product.id },
        transaction,
      });
    }

    // Handle addons association
    if (Array.isArray(addons)) {
      // First, remove all existing addon associations
      await product.removeAddons(await product.getAddons({ transaction }), {
        transaction,
      });

      // Then add the new addons
      if (addons.length > 0) {
        const validAddons = await addonModel.findAll({
          where: { id: addons },
          transaction,
        });
        await product.addAddons(validAddons, { transaction });
      }
    }

    // Fetch updated product with all associations
    const updatedProduct = await productModel.findByPk(+req.params.id, {
      include: [
        { model: productMediaModel, as: "mediaArr" },
        { model: productVariantModel, as: "variants" },
        { model: addonModel, as: "addons" },
      ],
      transaction,
    });

    if (!updatedProduct) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.PRODUCT.PRODUCT_NOT_FOUND,
        data: null,
      };
    }

    await transaction.commit();

    return {
      ...generalConstant.EN.PRODUCT.UPDATE_PRODUCT_SUCCESS,
      data: updatedProduct,
    };
  } catch (error) {
    console.error("UpdateById error:", error);
    await transaction.rollback().catch((rollbackError) => {
      console.error("Rollback error:", rollbackError);
    });
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

const importFromExcel = async (file) => {
  const transaction = await sequelize.transaction();
  try {
    const products = parseExcel(file.path);

    // Create products in database
    const createdProducts = await productModel.bulkCreate(products, {
      transaction,
      returning: true,
      validate: true,
    });

    await transaction.commit();
    return {
      status: 201,
      success: true,
      data: { count: createdProducts.length },
      message: "Products imported successfully",
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
  importFromExcel,
};
