const {
  sequelize,
  emailTemplateModel,
  activeTemplateModel,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const findActiveTemplate = await activeTemplateModel.findOne({
      where: { actionKey: req.body.actionKey },
      transaction,
    });

    let result = null;
    if (findActiveTemplate) {
      if (!req.body.templateId) {
        await transaction.rollback();
        return {
          ...generalConstant.EN.ACTIVE_EMAIL_TEMPLATE
            .REQUIRED_AT_LEAST_ONE_ACTIVE_TEMPLATE,
          data: null,
        };
      }
      if (findActiveTemplate.templateId !== req.body.templateId) {
        await emailTemplateModel.update(
          { activeTemplateId: null },
          { where: { id: findActiveTemplate.templateId }, transaction },
        );
        await findActiveTemplate.update(
          { templateId: req.body.templateId },
          { transaction },
        );

        await emailTemplateModel.update(
          { activeTemplateId: findActiveTemplate.id },
          { where: { id: req.body.templateId }, transaction },
        );

        result = findActiveTemplate;
      } else {
        result = findActiveTemplate;
      }
    } else {
      result = await activeTemplateModel.create(
        {
          actionKey: req.body.actionKey,
          templateId: req.body.templateId,
        },
        { transaction },
      );

      await emailTemplateModel.update(
        { activeTemplateId: result.id },
        { where: { id: req.body.templateId }, transaction },
      );
    }

    await transaction.commit();

    return {
      ...generalConstant.EN.ACTIVE_EMAIL_TEMPLATE
        .CREATE_ACTIVE_EMAIL_TEMPLATE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in create function:", error);
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await activeTemplateModel.findByPk(+req.params.id, {
      include: [
        {
          model: emailTemplateModel,
          as: "emailTemplate",
        },
      ],
    });

    if (result) {
      return {
        ...generalConstant.EN.ACTIVE_EMAIL_TEMPLATE
          .ACTIVE_EMAIL_TEMPLATE_GET_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.ACTIVE_EMAIL_TEMPLATE
          .ACTIVE_EMAIL_TEMPLATE_GET_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    // Log or handle the error
    throw error;
  }
};

const findAllActiveTemplate = async (req) => {
  try {
    let { limit, page, actionKey } = req.query;
    const filters = {};
    const include = [];

    if (actionKey) {
      filters.actionKey = {
        [Op.iLike]: `%${actionKey}%`,
      };
    }

    const result = await paginate(activeTemplateModel, {
      limit,
      page,
      filters,
      include,
    });
    if (result) {
      return {
        ...generalConstant.EN.ACTIVE_EMAIL_TEMPLATE
          .ACTIVE_EMAIL_TEMPLATE_LIST_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.ACTIVE_EMAIL_TEMPLATE
          .ACTIVE_EMAIL_TEMPLATE_LIST_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getById,
  findAllActiveTemplate,
  getById,
};
