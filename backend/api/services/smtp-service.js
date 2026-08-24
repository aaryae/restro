const { smtpModel } = require("../../models");
const generalConstant = require("../../constants/general-constant");

const create = async (req) => {
  try {
    const check = await smtpModel.findOne();
    if (check) {
      return {
        ...generalConstant.EN.SMTP.ALREADY_HAS_ONE,
        data: null,
      };
    }
    const result = await smtpModel.create(req.body);
    if (!result) {
      return {
        ...generalConstant.EN.SMTP.CREATE_SMTP_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SMTP.CREATE_SMTP_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await smtpModel.findOne();

    if (result) {
      return {
        ...generalConstant.EN.SMTP.SMTP_GET_SUCCESS,
        data: result,
      };
    } else {
      return {
        ...generalConstant.EN.SMTP.SMTP_GET_FAILURE,
        data: null,
      };
    }
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const result = await smtpModel.findOne();
    if (!result) {
      return {
        ...generalConstant.EN.SMTP.SMTP_NOT_FOUND,
        data: null,
      };
    }

    const updated = await result.update(req.body);
    if (!updated) {
      return {
        ...generalConstant.EN.SMTP.UPDATE_SMTP_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.SMTP.UPDATE_SMTP_SUCCESS,
      data: updated,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getById,
  getById,
  updateById,
};
