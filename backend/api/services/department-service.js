const { departmentModel } = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");
const slugGenerator = require("../../utils/slugify");

const create = async (req) => {
  try {
    req.body.slug = slugGenerator(req.body.name);
    const result = await departmentModel.create(req.body);
    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Department create failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Department create successfully`,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, slug } = req.query;
    const filters = {};
    const include = [];

    if (slug) {
      filters.slug = {
        [Op.like]: `%${slug}%`,
      };
    }

    const result = await paginate(departmentModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Department List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Department List successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await departmentModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Department Not Found`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Department Get successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const result = await departmentModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Department Not Found`,
        data: null,
      };
    }

    const updated = await result.update(req.body);
    if (!updated) {
      return {
        status: 500,
        success: false,
        message: `Department updated Failed`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Department updated successfully`,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await departmentModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Department Not Found`,
        data: null,
      };
    }

    const deleted = await result.destroy();
    if (!deleted) {
      return {
        status: 500,
        success: false,
        message: `Department delete failed`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Department delete successfully`,
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
  deleteById,
};
