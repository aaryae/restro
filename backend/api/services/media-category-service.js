const { mediaCategoryModel, mediaModel, sequelize } = require("../../models");
const generalConstant = require("../../constants/general-constant");
const slugGenerator = require("../../utils/slugify");
const paginate = require("../../utils/paginate");
const { Op } = require("sequelize");

const create = async (req) => {
  try {
    req.body.slug = slugGenerator(req.body.name);
    req.body.createdBy = req.user.id;
    // Check if the slug is already in use
    const isUsedSlug = await mediaCategoryModel.findOne({
      where: { slug: req.body.slug },
    });

    if (isUsedSlug) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_NAME_ALREADY_USED,
        data: null,
      };
    }

    // Create department if slug is not used
    const mediaCategory = await mediaCategoryModel.create(req.body);

    if (!mediaCategory) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.CREATE_MEDIA_CATEGORY_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.MEDIA_CATEGORY.CREATE_MEDIA_CATEGORY_SUCCESS,
      data: mediaCategory,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const mediaCategory = await mediaCategoryModel.findByPk(+req.params.id, {
      include: [
        {
          model: mediaModel,
          as: "media",
        },
      ],
    });

    if (mediaCategory) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_FOUND,
        data: mediaCategory,
      };
    } else {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const findAll = async (req) => {
  try {
    let { limit, page, slug } = req.query;
    const filters = {};
    // const include = [];

    if (slug) {
      filters.slug = {
        [Op.iLike]: `%${slug}%`,
      };
    }
    const result = await paginate(mediaCategoryModel, {
      limit,
      page,
      filters,
      // include,
    });
    if (result) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_LIST_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_LIST_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  try {
    const mediaCategory = await mediaCategoryModel.findByPk(+req.params.id);

    if (!mediaCategory) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    req.body.slug = slugGenerator(req.body.name);
    req.body.updatedBy = req.user.id;
    const updatedMediaCategory = await mediaCategory.update(req.body);

    if (!updatedMediaCategory) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.UPDATE_MEDIA_CATEGORY_FAILURE,
        data: null,
      };
    } else {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.UPDATE_MEDIA_CATEGORY_SUCCESS,
        data: updatedMediaCategory,
      };
    }
  } catch (error) {
    throw error;
  }
};

const deleteMediaCategory = async (req) => {
  try {
    if (+req.params.id === 355) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_CANNOT_BE_DELETED,
        data: null,
      };
    }
    const mediaCategory = await mediaCategoryModel.findByPk(+req.params.id, {
      include: [
        {
          model: mediaModel,
          as: "media",
        },
      ],
    });

    if (!mediaCategory) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_NOT_FOUND,
        data: null,
      };
    }
    if (mediaCategory.media?.length > 0) {
      return {
        ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_CONTAINS_MEDIA,
        data: null,
      };
    }

    await mediaCategory.destroy();
    return {
      ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getById,
  findAll,
  update,
  deleteMediaCategory,
};
