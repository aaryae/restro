const {
  orderModel,
  departmentModel,
  orderItemModel,
  kotModel,
} = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");

const list = async (req) => {
  try {
    let { limit, page, kotNumber, status, orderId, departmentId } = req.query;
    const filters = {};
    const include = [
      {
        model: orderModel,
        as: "order",
      },
      {
        model: departmentModel,
        as: "department",
      },
      {
        model: orderItemModel,
        as: "orderItems",
      },
    ];

    if (kotNumber) {
      filters.kotNumber = {
        [Op.eq]: parseInt(kotNumber),
      };
    }

    if (status) {
      filters.status = status;
    }

    if (orderId) {
      filters.orderId = {
        [Op.eq]: parseInt(orderId),
      };
    }

    if (departmentId) {
      filters.departmentId = {
        [Op.eq]: parseInt(departmentId),
      };
    }

    const result = await paginate(kotModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `KOT List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `KOT List successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  list,
};
