const { Op } = require("sequelize");
const generalConstant = require("../../constants/general-constant");
const {
  readSheet,
  normalizeRows,
  missingRequiredColumns,
} = require("../../lib/product-import");
const {
  productModel,
  productMediaModel,
  productVariantModel,
  productCategoryModel,
  departmentModel,
  addonModel,
  orderItemModel,
  sequelize,
} = require("../../models");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

/** Keeps a single import transaction to a sane size. */
const MAX_IMPORT_ROWS = 2000;
// const { Op } = require("sequelize");
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
    // Place newly created items first in the admin list (order ASC).
    const minOrder = await productModel.min("order", { transaction });
    const nextOrder =
      minOrder === null || minOrder === undefined ? 0 : Number(minOrder) - 1;
    await product.update({ order: nextOrder }, { transaction });

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
        [Op.iLike]: `%${slug}%`,
      };
    }
    if (name) {
      filters.name = {
        [Op.iLike]: `%${name}%`,
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

    // Handle media updates only when the client sent mediaArr
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

    // Handle variants only when hasVariant / variants were explicitly sent
    const touchingVariants =
      Object.prototype.hasOwnProperty.call(req.body, "hasVariant") ||
      Object.prototype.hasOwnProperty.call(req.body, "variants");

    if (touchingVariants) {
      const enableVariants =
        productData.hasVariant === undefined
          ? product.hasVariant
          : Boolean(productData.hasVariant);

      if (enableVariants && Array.isArray(variants) && variants.length > 0) {
        await productVariantModel.destroy({
          where: { productId: product.id },
          transaction,
        });

        const bulkVariants = variants.map((variant) => ({
          ...variant,
          productId: product.id,
        }));

        await productVariantModel.bulkCreate(bulkVariants, { transaction });
      } else if (
        Object.prototype.hasOwnProperty.call(req.body, "hasVariant") &&
        productData.hasVariant === false
      ) {
        await productVariantModel.destroy({
          where: { productId: product.id },
          transaction,
        });
      }
    }

    // Handle addons association only when sent
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
    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({ resourceType: "product", record: product, req });
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

/**
 * Bulk import menu items from an .xlsx/.xls/.csv sheet.
 *
 * Categories and departments are referenced by name (not id) because that is
 * what a cafe actually has in their existing menu sheet. Missing categories can
 * be created on the fly; departments must already exist since they drive KOT
 * routing. `dryRun` validates and reports without persisting anything.
 */
const importFromExcel = async (file, options = {}) => {
  const { dryRun = false, createMissingCategories = true } = options;

  let rows;
  let headerMap;
  try {
    ({ rows, headerMap } = readSheet(file.path));
  } catch {
    return {
      status: 400,
      success: false,
      message: "That file could not be read. Save it as .xlsx or .csv and try again.",
      data: null,
    };
  }

  const missingColumns = missingRequiredColumns(headerMap);
  if (missingColumns.length) {
    return {
      status: 400,
      success: false,
      message: `Missing required column(s): ${missingColumns.join(", ")}`,
      data: null,
    };
  }

  if (!rows.length) {
    return {
      status: 400,
      success: false,
      message: "The file has no rows to import.",
      data: null,
    };
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      status: 400,
      success: false,
      message: `Import up to ${MAX_IMPORT_ROWS} rows at a time — split the file and try again.`,
      data: null,
    };
  }

  const candidates = normalizeRows(rows, headerMap);

  const transaction = await sequelize.transaction();
  try {
    // Sequential: one transaction rides a single connection.
    const categories = await productCategoryModel.findAll({ transaction });
    const departments = await departmentModel.findAll({ transaction });
    const existingProducts = await productModel.findAll({
      attributes: ["name"],
      transaction,
    });

    const categoryByName = new Map(
      categories.map((c) => [c.name.trim().toLowerCase(), c]),
    );
    const departmentByName = new Map(
      departments.map((d) => [d.name.trim().toLowerCase(), d]),
    );
    const existingNames = new Set(
      existingProducts.map((p) => p.name.trim().toLowerCase()),
    );
    const defaultDepartment = departments[0] || null;

    const minOrder = await productModel.min("order", { transaction });
    let nextOrder =
      minOrder === null || minOrder === undefined ? 0 : Number(minOrder) - 1;

    const results = [];
    const createdCategories = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const candidate of candidates) {
      const errors = [...candidate.errors];

      if (!errors.length && existingNames.has(candidate.name.toLowerCase())) {
        skipped += 1;
        results.push({
          rowNumber: candidate.rowNumber,
          name: candidate.name,
          status: "skipped",
          message: "An item with this name already exists",
        });
        continue;
      }

      let category = candidate.category
        ? categoryByName.get(candidate.category.toLowerCase())
        : null;
      if (candidate.category && !category && !createMissingCategories) {
        errors.push(`Category "${candidate.category}" does not exist`);
      }

      const department = candidate.department
        ? departmentByName.get(candidate.department.toLowerCase())
        : defaultDepartment;
      if (!department) {
        errors.push(
          candidate.department
            ? `Department "${candidate.department}" does not exist`
            : "No department found — create one before importing",
        );
      }

      if (errors.length) {
        failed += 1;
        results.push({
          rowNumber: candidate.rowNumber,
          name: candidate.name,
          status: "failed",
          message: errors.join("; "),
        });
        continue;
      }

      // Created only now that the row is known to be importable.
      if (!category) {
        category = await productCategoryModel.create(
          {
            name: candidate.category,
            slug: slugGenerator(candidate.category),
          },
          { transaction },
        );
        categoryByName.set(candidate.category.toLowerCase(), category);
        createdCategories.push(category.name);
      }

      await productModel.create(
        {
          name: candidate.name,
          slug: slugGenerator(candidate.name),
          description: candidate.description || null,
          price: candidate.price,
          quantity: candidate.quantity,
          stockStatus: candidate.stockStatus,
          productCategoryId: category.id,
          departmentId: department.id,
          hasVariant: false,
          order: nextOrder,
        },
        { transaction },
      );

      nextOrder -= 1;
      existingNames.add(candidate.name.toLowerCase());
      created += 1;
      results.push({
        rowNumber: candidate.rowNumber,
        name: candidate.name,
        status: dryRun ? "ready" : "created",
        message: dryRun ? "Ready to import" : "Imported",
      });
    }

    if (dryRun) {
      await transaction.rollback();
    } else {
      await transaction.commit();
    }

    return {
      status: 200,
      success: true,
      message: dryRun
        ? `${created} item(s) ready to import`
        : `${created} item(s) imported successfully`,
      data: {
        dryRun,
        totalRows: candidates.length,
        created,
        skipped,
        failed,
        createdCategories: dryRun ? [] : createdCategories,
        rows: results,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Top-selling products for the POS create-order grid.
 * Priority: staff-curated (`isTopSelling`) → sales volume → random fill.
 */
const topSelling = async (req) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 8, 1),
      50,
    );

    const productInclude = [
      { model: productMediaModel, as: "mediaArr" },
      { model: addonModel, as: "addons" },
    ];

    const curated = await productModel.findAll({
      where: { isTopSelling: true },
      include: productInclude,
      order: [
        ["topSellingOrder", "ASC"],
        ["order", "ASC"],
        ["id", "ASC"],
      ],
      limit,
    });

    let products = curated;
    const remainingAfterCurated = limit - products.length;

    if (remainingAfterCurated > 0) {
      const excludeIds = products.map((p) => p.id);
      const salesRows = await orderItemModel.findAll({
        attributes: [
          "productId",
          [sequelize.fn("SUM", sequelize.col("quantity")), "totalSold"],
        ],
        where: {
          productId: {
            [Op.ne]: null,
            ...(excludeIds.length ? { [Op.notIn]: excludeIds } : {}),
          },
          isAddon: false,
          status: { [Op.ne]: "cancelled" },
        },
        group: ["productId"],
        order: [[sequelize.literal('"totalSold"'), "DESC"]],
        limit: remainingAfterCurated,
        raw: true,
      });

      const topIds = salesRows
        .map((row) => Number(row.productId))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (topIds.length) {
        const topProducts = await productModel.findAll({
          where: { id: { [Op.in]: topIds } },
          include: productInclude,
        });
        const byId = new Map(topProducts.map((p) => [p.id, p]));
        products = products.concat(
          topIds.map((id) => byId.get(id)).filter(Boolean),
        );
      }
    }

    const remaining = limit - products.length;
    if (remaining > 0) {
      const excludeIds = products.map((p) => p.id);
      const fillers = await productModel.findAll({
        where: excludeIds.length
          ? { id: { [Op.notIn]: excludeIds } }
          : undefined,
        include: productInclude,
        order: [sequelize.random()],
        limit: remaining,
      });
      products = products.concat(fillers);
    }

    return {
      ...generalConstant.EN.PRODUCT.PRODUCT_LIST_SUCCESS,
      data: {
        data: products,
        total: products.length,
        limit,
        page: 1,
        totalPages: 1,
      },
      message: "Top selling products retrieved successfully",
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
  updateByOrder,
  importFromExcel,
  topSelling,
};
