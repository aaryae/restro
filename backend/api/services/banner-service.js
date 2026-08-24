const generalConstant = require("../../constants/general-constant");
const { sequelize, bannerModel, bannerItemsModel } = require("../../models");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

const create = async (req) => {
  const transaction = await sequelize.transaction();

  try {
    const { bannerItems, ...rest } = req.body;
    rest.slug = slugGenerator(rest.name);
    const result = await bannerModel.create(rest, { transaction });

    if (!result) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.BANNER.CREATE_BANNER_FAILURE,
        data: null,
      };
    }

    if (bannerItems?.length > 0) {
      const bulkBannerItemData = bannerItems.map((item) => ({
        bannerId: result.id,
        ...item,
      }));

      await bannerItemsModel.bulkCreate(bulkBannerItemData, { transaction });
    }
    await transaction.commit();

    return {
      ...generalConstant.EN.BANNER.CREATE_BANNER_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug } = req.query;
    const filter = {};
    const include = [];

    const result = await paginate(bannerModel, {
      limit,
      page,
      filter,
      include,
    });
    if (result) {
      return {
        ...generalConstant.EN.BANNER.BANNER_LIST_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.BANNER.BANNER_LIST_FAILURE,
        data: result,
      };
    }
  } catch (error) {
    throw error;
  }
};

const getBySlug = async (req) => {
  try {
    const result = await bannerModel.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: bannerItemsModel,
          as: "bannerItems",
        },
      ],
    });
    if (result) {
      return {
        ...generalConstant.EN.BANNER.BANNER_FOUND,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.BANNER.BANNER_NOT_FOUND,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await bannerModel.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: bannerItemsModel,
          as: "bannerItems",
        },
      ],
    });
    if (result) {
      return {
        ...generalConstant.EN.BANNER.BANNER_FOUND,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.BANNER.BANNER_NOT_FOUND,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  const { id } = req.params;
  const { bannerItems, ...rest } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const isBanner = await bannerModel.findByPk(id);
    if (!isBanner) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.BANNER.BANNER_NOT_FOUND,
        data: null,
      };
    }
    if (Object.keys(rest).length > 0) {
      const { name, slug, ...others } = rest;
      await bannerModel.update(others, {
        where: { id },
        transaction,
      });
    }

    // update banner items
    if (bannerItems?.length > 0) {
      await bannerItemsModel.destroy(
        { where: { bannerId: id } },
        { transaction },
      );
      const bulkBannerData = bannerItems.map((items) => ({
        bannerId: id,
        ...items,
      }));
      await bannerItemsModel.bulkCreate(bulkBannerData, { transaction });
    } else {
      await bannerItemsModel.destroy({ where: { bannerId: id } });
    }
    await transaction.commit();
    return {
      ...generalConstant.EN.BANNER.UPDATE_BANNER_SUCCESS,
      data: null,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteBanner = async (req) => {
  try {
    const result = await bannerModel.findByPk(+req.params.id);

    if (!result) {
      return {
        ...generalConstant.EN.BANNER.BANNER_NOT_FOUND,
        data: null,
      };
    }
    await result.destroy();
    return {
      ...generalConstant.EN.BANNER.BANNER_DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { create, list, getBySlug, getById, update, deleteBanner };
