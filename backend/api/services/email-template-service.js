const { emailTemplateModel, activeTemplateModel } = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const { Op } = require("sequelize");

const create = async (req) => {
  try {
    const result = await emailTemplateModel.create(req.body);
    if (!result) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.CREATE_EMAIL_TEMPLATE_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.EMAIL_TEMPLATE.CREATE_EMAIL_TEMPLATE_SUCCESS,
      data: result,
    };
  } catch (error) {
    // Log or handle the error
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await emailTemplateModel.findByPk(+req.params.id);

    if (result) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_GET_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_NOT_FOUND,
        data: null,
      };
    }
  } catch (error) {
    // Log or handle the error
    throw error;
  }
};

const findAllTemplate = async (req) => {
  try {
    let returnData = { ...generalConstant.EN.SERVER_ERROR };
    let { limit, page, templateKey } = req.query;
    const filters = {};
    const include = [
      {
        model: activeTemplateModel,
        as: "activeTemplate",
      },
    ];

    if (templateKey) {
      filters.templateKey = {
        [Op.like]: `%${templateKey}%`,
      };
    }

    const result = await paginate(emailTemplateModel, {
      limit,
      page,
      filters,
      include,
    });
    if (result) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_LIST_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_LIST_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const update = async (req) => {
  try {
    const result = await emailTemplateModel.findByPk(+req.params.id);

    if (!result) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_NOT_FOUND,
        data: null,
      };
    }

    const updated = await result.update(req.body);

    if (!updated) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.UPDATE_EMAIL_TEMPLATE_FAILURE,
        data: null,
      };
    } else {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.UPDATE_EMAIL_TEMPLATE_SUCCESS,
        data: updated,
      };
    }
  } catch (error) {
    throw error;
  }
};

const deleteTemplate = async (req) => {
  try {
    const result = await emailTemplateModel.findByPk(+req.params.id);

    if (!result) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_NOT_FOUND,
        data: null,
      };
    }
    const isUsedTemplate = await activeTemplateModel.findOne({
      where: {
        templateId: result.id,
      },
    });
    if (isUsedTemplate) {
      return {
        ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_USED_IN,
        data: null,
      };
    }

    const { archiveToTrash } = require("../../helpers/trash-helper");
    await archiveToTrash({
      resourceType: "email_template",
      record: result,
      req,
    });
    await result.destroy();

    return {
      ...generalConstant.EN.EMAIL_TEMPLATE.EMAIL_TEMPLATE_DELETE_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getById,
  update,
  deleteTemplate,
  findAllTemplate,
};
