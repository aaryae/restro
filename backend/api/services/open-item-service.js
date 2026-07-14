const {
  openItemModel,
  openItemMediaModel,
  sequelize,
} = require("../../models");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");
const httpStatus = require("http-status");
const { Op } = require("sequelize");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    req.body.slug = slugGenerator(req.body.name);

    const openItem = await openItemModel.create(req.body, { transaction });

    const mediaArr = req.body.mediaArr;
    if (mediaArr?.length > 0) {
      const bulkMedia = mediaArr.map((each) => ({
        imageUrl: each,
        openItemId: openItem.id,
      }));
      await openItemMediaModel.bulkCreate(bulkMedia, { transaction });
    }

    if (!openItem) {
      await transaction.rollback();
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Creation Failed",
        data: null,
      };
    }

    await transaction.commit();
    return {
      status: httpStatus.OK,
      success: true,
      message: "Open Item Created Successfully",
      data: openItem,
    };
  } catch (error) {
    console.error("CreateOpenItem error:", error);
    await transaction.rollback().catch((rollbackError) => {
      console.error("Rollback error:", rollbackError);
    });
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug, name } = req.query;
    const filters = {};
    const include = [{ model: openItemMediaModel, as: "mediaArr" }];

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

    const result = await paginate(openItemModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item List Failed",
        data: null,
      };
    }

    return {
      status: httpStatus.OK,
      success: true,
      message: "Open Item List Success",
      data: result,
    };
  } catch (error) {
    console.error("ListOpenItems error:", error);
    throw error;
  }
};

const getById = async (req) => {
  try {
    const openItem = await openItemModel.findByPk(+req.params.id, {
      include: [{ model: openItemMediaModel, as: "mediaArr" }],
    });

    if (!openItem) {
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Not Found",
        data: null,
      };
    }
    return {
      status: httpStatus.OK,
      success: true,
      message: "Open Item Get Success",
      data: openItem,
    };
  } catch (error) {
    console.error("GetOpenItem error:", error);
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const openItem = await openItemModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!openItem) {
      await transaction.rollback();
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Not Found",
        data: null,
      };
    }

    const { mediaArr, ...openItemData } = req.body;

    // Update open item data
    const updated = await openItem.update(openItemData, { transaction });
    if (!updated) {
      await transaction.rollback();
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Update Failed",
        data: null,
      };
    }

    // Handle media updates
    if (Array.isArray(mediaArr)) {
      await openItemMediaModel.destroy({
        where: { openItemId: openItem.id },
        transaction,
      });

      const bulkMedia = mediaArr.map((imageUrl) => ({
        imageUrl,
        openItemId: openItem.id,
      }));

      await openItemMediaModel.bulkCreate(bulkMedia, { transaction });
    }

    // Fetch updated open item with media
    const updatedOpenItem = await openItemModel.findByPk(+req.params.id, {
      include: [{ model: openItemMediaModel, as: "mediaArr" }],
      transaction,
    });

    if (!updatedOpenItem) {
      await transaction.rollback();
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Not Found",
        data: null,
      };
    }

    await transaction.commit();

    return {
      status: httpStatus.OK,
      success: true,
      message: "Open Item Updated Successfully",
      data: updatedOpenItem,
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
    const openItem = await openItemModel.findByPk(+req.params.id);
    if (!openItem) {
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Not Found",
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({ resourceType: "open_item", record: openItem, req });
    const deleted = await openItem.destroy();
    if (!deleted) {
      return {
        status: httpStatus.NOT_ACCEPTABLE,
        success: false,
        message: "Open Item Delete Failed",
        data: null,
      };
    }
    return {
      status: httpStatus.OK,
      success: true,
      message: "Open Item Delete Success",
      data: null,
    };
  } catch (error) {
    console.error("DeleteOpenItem error:", error);
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
