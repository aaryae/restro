const { settingModel, socialModel, sequelize } = require("../../models");
const generalConstant = require("../../constants/general-constant");

const getOne = async () => {
  try {
    const setting = await settingModel.findOne({
      include: [
        {
          model: socialModel,
          as: "socials",
        },
      ],
    });

    if (!setting) {
      return {
        ...generalConstant.EN.SETTING.SETTING_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SETTING.SETTING_FOUND,
      data: setting,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const id = +req.params.id;
    const setting = await settingModel.findByPk(id, {
      include: [
        {
          model: socialModel,
          as: "socials",
        },
      ],
    });

    if (!setting) {
      return {
        ...generalConstant.EN.SETTING.SETTING_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SETTING.SETTING_FOUND,
      data: setting,
    };
  } catch (error) {
    throw error;
  }
};

// Update a Setting by ID and handle associated Social
const updateById = async (req) => {
  const transaction = await sequelize.transaction();

  try {
    const setting = await settingModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!setting) {
      await transaction.rollback();
      return {
        ...generalConstant.EN.SETTING.SETTING_NOT_FOUND,
        data: null,
      };
    }
    const { socials, ...rest } = req.body;
    const updatedSetting = await setting.update(rest, { transaction });

    if (!updatedSetting) {
      return {
        ...generalConstant.EN.SETTING.SETTING_UPDATE_FAILURE,
        data: null,
      };
    }

    if (socials?.length > 0) {
      await socialModel.destroy({
        where: { settingId: +req.params.id },
        transaction,
      });
      const createdSocials = await socialModel.bulkCreate(
        socials.map((social) => ({ ...social, settingId: +req.params.id })),
        { transaction },
      );

      if (!createdSocials) {
        return {
          ...generalConstant.EN.SETTING.SETTING_UPDATE_FAILURE,
          data: null,
        };
      }
    }

    await transaction.commit();

    return {
      ...generalConstant.EN.SETTING.SETTING_UPDATE_SUCCESS,
      data: updatedSetting,
    };
  } catch (error) {
    await transaction.rollback(); // Rollback the transaction on error
    throw error;
  }
};

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const existing = await settingModel.findOne({ transaction });
    if (existing) {
      await transaction.rollback();
      req.params.id = String(existing.id);
      return updateById(req);
    }

    const { socials, ...rest } = req.body;
    const setting = await settingModel.create(rest, { transaction });

    if (socials?.length > 0) {
      await socialModel.bulkCreate(
        socials.map((social) => ({ ...social, settingId: setting.id })),
        { transaction },
      );
    }

    await transaction.commit();
    return {
      ...generalConstant.EN.SETTING.SETTING_CREATE_SUCCESS,
      data: setting,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getById,
  updateById,
  getOne,
  create,
};
