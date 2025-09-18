const {
  orderModel,
  departmentModel,
  orderItemModel,
  kotModel,
  productModel,
  tableModel,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");
const paginate = require("../../utils/paginate");
const { startOfDay, endOfDay, parseISO } = require("date-fns");

const list = async (req) => {
  try {
    let { limit, page, kotNumber, status, orderId, departmentId, start, end } =
      req.query;
    const filters = {};
    const include = [
      {
        model: orderModel,
        as: "order",
        include: [
          {
            model: tableModel,
            as: "table",
          },
        ],
      },
      {
        model: departmentModel,
        as: "department",
      },
      {
        model: orderItemModel,
        as: "orderItems",
        include: [
          {
            model: productModel,
            as: "product",
          },
        ],
      },
    ];

    // Default to today's KOTs if no date range is provided
    if (!start && !end) {
      const today = new Date();
      filters.createdAt = {
        [Op.gte]: startOfDay(today),
        [Op.lt]: endOfDay(today),
      };
    } else {
      // Use provided date range
      if (start) {
        const start = parseISO(start);
        filters.createdAt = {
          ...filters.createdAt,
          [Op.gte]: startOfDay(start),
        };
      }
      if (end) {
        const end = parseISO(end);
        filters.createdAt = {
          ...filters.createdAt,
          [Op.lte]: endOfDay(end),
        };
      }
    }

    if (kotNumber) {
      filters.kotNumber = {
        [Op.eq]: parseInt(kotNumber),
      };
    }

    // handle filter if status is all
    if (status === "all") {
      delete filters.status;
    } else {
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

const updateKot = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params; // KOT ID from URL
    const { status } = req.body;

    // Define valid state transitions
    const validTransitions = {
      pending: ["preparing", "cancelled"],
      preparing: ["ready"],
      ready: [],
      cancelled: [], // No transitions allowed from cancelled
    };

    // Find KOT with associations
    const kot = await kotModel.findByPk(id, {
      transaction,
    });

    if (!kot) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: `KOT with ID ${id} not found`,
      };
    }

    // Validate status
    const validStatuses = ["pending", "preparing", "ready", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      };
    }

    // Check if the status transition is valid
    const currentStatus = kot.status;
    if (!validTransitions[currentStatus].includes(status)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed transitions: ${validTransitions[currentStatus].join(", ") || "none"}`,
      };
    }

    // Update KOT status
    await kot.update({ status }, { transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: `KOT updated successfully`,
      data: kot,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  list,
  updateKot,
};
