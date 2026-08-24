const generalConstant = require("../../constants/general-constant");
const { contactModel } = require("../../models");
const { sendMail } = require("../../utils/mailer");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  try {
    const result = await contactModel.create(req.body);

    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CREATE_CONTACT_FAILURE,
        data: null,
      };
    }

    const placeholders = {
      name: `${req.body.full_name}`,
      email: `${req.body.email}`,
    };

    await sendMail("contactEnquiry", placeholders, req.body.email);

    return {
      ...generalConstant.EN.CONTACT.CREATE_CONTACT_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page } = req.query;

    const filters = {};
    const include = [];
    const result = await paginate(contactModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CONTACT_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CONTACT.CONTACT_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await contactModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CONTACT_NOT_FOUND,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.CONTACT.CONTACT_FOUND,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await contactModel.findByPk(+req.params.id);
    if (!result) {
      return {
        ...generalConstant.EN.CONTACT.CONTACT_DELETE_FAILURE,
        data: null,
      };
    }
    await result.destroy();
    return {
      ...generalConstant.EN.CONTACT.DELETE_CONTACT_SUCCESS,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getById,
  list,
  deleteById,
};
