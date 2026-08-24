const sharp = require("sharp");
const { mediaCategoryModel, mediaModel } = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const httpStatus = require("http-status");
const generateFileName = require("../../utils/media/generateMediaName");
const checkIfMediaPathInUse = require("../../utils/media/isMediaUsed");
const { deleteMedia } = require("../../utils/media/deleteMedia");
const { Op } = require("sequelize");

const uploadMedia = async (req) => {
  try {
    if (!req.file) {
      return {
        ...generalConstant.EN.MEDIA.NO_FILE_UPLOADED,
        data: null,
      };
    }

    if (req.user?.role !== "customer") req.createdBy = req.user.id;

    if (req.body?.mediaCategoryId) {
      const mediaCategory = await mediaCategoryModel.findByPk(
        +req.body.mediaCategoryId,
      );
      if (!mediaCategory) {
        return {
          ...generalConstant.EN.MEDIA_CATEGORY.MEDIA_CATEGORY_NOT_FOUND,
          data: null,
        };
      }
    }
    const { path, size, mimetype } = req.file;

    // Create a new media entry in the database
    const newMedia = await mediaModel.create({
      name: req.body?.name || generateFileName(req),
      path: path,
      caption: req?.body?.caption,
      description: req?.body?.description,
      sizeInBytes: size,
      mimeType: mimetype,
      mediaCategoryId: +req.body.mediaCategoryId,
      createdBy: req?.createdBy,
    });
    if (!newMedia) {
      return {
        ...generalConstant.EN.MEDIA.CREATE_MEDIA_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.MEDIA.CREATE_MEDIA_SUCCESS,
      data: newMedia,
    };
  } catch (error) {
    // Log or handle the error
    throw error;
  }
};

const getById = async (req) => {
  try {
    const media = await mediaModel.findByPk(+req.params.id);

    if (media) {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_FOUND,
        data: media,
      };
    } else {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_NOT_FOUND,
        data: null,
      };
    }
  } catch (error) {
    // Log or handle the error
    throw error;
  }
};

const findAll = async (req) => {
  try {
    let { limit, page, mediaCategoryId } = req.query;
    const filters = {};
    const include = [];

    if (mediaCategoryId) {
      // Exact match: mediaCategoryId is an integer (Postgres rejects LIKE on ints)
      filters.mediaCategoryId = +mediaCategoryId;
    }
    const result = await paginate(mediaModel, {
      limit,
      page,
      filters,
      include,
    });
    if (result) {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_LIST_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_LIST_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const changeName = async (req) => {
  try {
    const media = await mediaModel.findByPk(+req.params.id);

    if (!media) {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_NOT_FOUND,
        data: null,
      };
    }
    let updatedBy = req.user.id;
    const updatedMedia = await media.update({ name: req.body.name, updatedBy });

    if (!updatedMedia) {
      return {
        ...generalConstant.EN.MEDIA.UPDATE_MEDIA_FAILURE,
        data: null,
      };
    } else {
      return {
        ...generalConstant.EN.MEDIA.UPDATE_MEDIA_SUCCESS,
        data: updatedMedia,
      };
    }
  } catch (error) {
    throw error;
  }
};
const mediaDelete = async (req, res, next) => {
  try {
    const media = await mediaModel.findByPk(+req.params.id);
    if (!media) {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_NOT_FOUND,
        data: null,
      };
    }
    // If the media path is directly used in other tables, perform a check here (example below)
    const isPathInUse = await checkIfMediaPathInUse(media.path);
    if (isPathInUse.length > 0) {
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: `Media is used in other modules:  ${isPathInUse.join(", ")}`,
      };
    }
    // Proceed to delete the media record
    const deleteMedias = await deleteMedia(mediaModel, +req.params.id);
    if (!deleteMedias) {
      return {
        ...generalConstant.EN.MEDIA.MEDIA_DELETE_SUCCESS,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.MEDIA.MEDIA_DELETE_SUCCESS,
      data: null,
    };
  } catch (err) {
    throw err;
  }
};

const bulkMediaDelete = async (req, res, next) => {
  try {
    const mediaIds = req.body.mediaIds; // Expect an array of media IDs from the request body
    // Fetch all media records matching the provided IDs
    const mediaRecords = await mediaModel.findAll({
      where: { id: mediaIds },
    });

    if (mediaRecords.length !== mediaIds.length) {
      const foundIds = mediaRecords.map((media) => media.id);
      const missingIds = mediaIds.filter((id) => !foundIds.includes(id));
      return {
        status: httpStatus.NOT_FOUND,
        success: false,
        message: `Media not found for IDs: ${missingIds.join(", ")}`,
      };
    }

    // Check if paths are in use
    const usedPaths = [];
    const unusedMedia = [];

    for (const media of mediaRecords) {
      const isPathInUse = await checkIfMediaPathInUse(media.path);
      if (isPathInUse.length > 0) {
        usedPaths.push({
          id: media.id,
          path: media.path,
          modules: isPathInUse,
        });
      } else {
        unusedMedia.push(media.id);
        await deleteMedia(mediaModel, unusedMedia);
      }
    }

    // If some paths are in use, return details
    if (usedPaths.length > 0) {
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: `Media is used in other modules:  ${usedPaths.join(", ")}`,
        data: usedPaths,
      };
    }

    // Delete unused media records
    await deleteMedia(mediaModel, unusedMedia, req.payload);

    return {
      status: httpStatus.OK,
      success: true,
      message: "Media deleted successfully.",
      data: null,
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  uploadMedia,
  getById,
  findAll,
  changeName,
  mediaDelete,
  bulkMediaDelete,
};
