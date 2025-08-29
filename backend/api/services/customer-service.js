const { Op } = require("sequelize");
const { customerModel, orderModel } = require("../../models");
const paginate = require("../../utils/paginate");

const create = async (req) => {
  try {
    const result = await customerModel.create(req.body);
    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Customer create failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Customer create successfully`,
    };
  } catch (error) {
    throw error;
  }
};

const list = async (req) => {
  try {
    let { limit, page, firstName, phone, email, isCombo } = req.query;
    const filters = {};
    const include = [];

    const isComboSearch = isCombo === "true";

    // Log query parameters for debugging
    console.log({ isComboSearch, firstName, phone, email });

    if (isComboSearch && phone) {
      // Combo search: apply phone value across firstName, email, and mobileNo
      const searchTerm = `%${phone.trim()}%`;
      filters[Op.or] = [
        { firstName: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { mobileNo: { [Op.like]: searchTerm } },
      ];
    } else {
      // Individual field filters
      if (firstName) {
        filters.firstName = { [Op.like]: `%${firstName.trim()}%` };
      }
      if (phone) {
        filters.mobileNo = { [Op.like]: `%${phone.trim()}%` };
      }
      if (email) {
        filters.email = { [Op.like]: `%${email.trim()}%` };
      }
    }

    const result = await paginate(customerModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Customer List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Customer List successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const result = await customerModel.findByPk(+req.params.id, {
      include: {
        model: orderModel,
        as: "orders",
      },
    });
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Customer Not Found`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Customer Get successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  try {
    const result = await customerModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Customer Not Found`,
        data: null,
      };
    }

    const updated = await result.update(req.body);
    if (!updated) {
      return {
        status: 500,
        success: false,
        message: `Customer create failed`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Customer create success`,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

const deleteById = async (req) => {
  try {
    const result = await customerModel.findByPk(+req.params.id);
    if (!result) {
      return {
        status: 404,
        success: false,
        message: `Customer Not Found`,
        data: null,
      };
    }

    const deleted = await result.destroy();
    if (!deleted) {
      return {
        status: 500,
        success: false,
        message: `Customer Not Deleted`,
        data: null,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Customer Deleted Successfully`,
      data: null,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { create, getById, list, deleteById, updateById };
