const { Op, Sequelize } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");
const { getLocalDateRange } = require("../../utils/timezone");
const { generateUUID } = require("../../utils/uuidGenerator");

const {
  customerModel,
  orderModel,
  orderItemModel,
  productModel,
  tableModel,
  productMediaModel,
  accountModel,
  sequelize,
  userModel,
  revenueModel,
} = require("../../models");

const { withTransaction } = require("../../helpers/order/transaction");
const { awardLoyaltyPoints } = require("../../helpers/loyalty/award-points");

const paginate = require("../../utils/paginate");
const paginateWithAggregate = require("../../utils/paginateWithAggregate");

const createRevenue = async (req) => {
  const transaction = await revenueModel.sequelize.transaction();
  try {
    const {
      amount,
      paymentMethod,
      cash_or_credit,
      customerId,
      userId,
      accountId,
      remarks,
    } = req.body;

    // Validate required fields
    if (!amount || !userId || !accountId) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Amount, userId, and accountId are required",
      };
    }

    // Validate paymentMethod
    const validPaymentMethods = ["cash", "card", "online"];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Invalid payment method. Must be one of ${validPaymentMethods.join(", ")}`,
      };
    }

    // Validate cash_or_credit
    const validCashOrCredit = ["cash", "credit"];
    if (cash_or_credit && !validCashOrCredit.includes(cash_or_credit)) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Invalid cash_or_credit. Must be one of ${validCashOrCredit.join(", ")}`,
      };
    }

    // Validate accountId
    const account = await accountModel.findByPk(accountId, { transaction });
    if (!account) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Account not found for ID: ${accountId}`,
      };
    }

    // Validate customerId if provided
    if (customerId) {
      const customer = await customerModel.findByPk(customerId, {
        transaction,
      });
      if (!customer) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: `Customer not found for ID: ${customerId}`,
        };
      }
    }

    // Create Revenue record
    const revenue = await revenueModel.create(
      {
        amount,
        paymentMethod: paymentMethod || "cash",
        cash_or_credit: cash_or_credit || "cash",
        customerId,
        userId,
        accountId,
        remarks,
      },
      { transaction },
    );

    console.log(
      `[createRevenue] Created revenue ID: ${revenue.id} with accountId: ${accountId}`,
    );

    // // Update account balance
    // const newBalance = Number(account.currentBalance) + Number(amount);
    // if (newBalance < 0) {
    //   await transaction.rollback();
    //   return {
    //     status: 400,
    //     success: false,
    //     message: `Balance cannot be negative for account ID: ${accountId}`,
    //   };
    // }

    // await account.update(
    //   {
    //     currentBalance: newBalance,
    //   },
    //   { transaction },
    // );

    // console.log(
    //   `[createRevenue] Updated account ID: ${account.id}, new currentBalance: ${newBalance}`,
    // );

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: "Revenue created successfully",
      data: {
        revenue,
      },
    };
  } catch (error) {
    await transaction.rollback();
    console.error("[createRevenue] Error:", error.message);
    throw error;
  }
};

const updateRevenue = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { customerId, ...rest } = req.body;

    // Find the revenue entry
    const revenue = await revenueModel.findByPk(id, { transaction });
    if (!revenue) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Revenue entry not found",
      };
    }

    // Handle existing customer if customerId is provided
    if (customerId !== undefined) {
      if (customerId !== null) {
        const customer = await customerModel.findByPk(customerId, {
          transaction,
        });
        if (!customer) {
          await transaction.rollback();
          return {
            status: 404,
            success: false,
            message: "Customer not found",
          };
        }
      }
    }

    // Update only provided fields
    await revenue.update(
      {
        ...rest,
        customerId: customerId !== undefined ? customerId : revenue.customerId,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Revenue updated successfully",
      data: revenue,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const deleteRevenue = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // Find the revenue entry
    const revenue = await revenueModel.findByPk(id, { transaction });
    if (!revenue) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Revenue entry not found",
      };
    }

    // Reverse account balance impact added during revenue creation
    const account = await accountModel.findByPk(revenue.accountId, {
      transaction,
      lock: true,
    });
    if (!account) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Account not found for ID: ${revenue.accountId}`,
      };
    }

    await account.reload({ transaction });
    const currentBalance = Number(account.currentBalance) || 0;
    const revenueAmount = Number(revenue.amount) || 0;
    const nextBalance = currentBalance - revenueAmount;

    if (nextBalance < 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message:
          "Cannot delete revenue because it would make account balance negative",
      };
    }

    await account.update({ currentBalance: nextBalance }, { transaction });

    // Delete the revenue entry
    await revenue.destroy({ transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Revenue deleted successfully",
      data: null,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const checkoutOrder = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { tableId } = req.params;
    let {
      orderId,
      checkoutAll = false,
      customerId,
      customerDetails,
      sessionId,
      isGuestOrder = false,
      ...updateData
    } = req.body;

    // Validate tableId
    if (!tableId) {
      await transaction.rollback();
      return { status: 400, success: false, message: "Table ID is required" };
    }

    // Validate paymentMethod if provided
    const validPaymentMethods = ["cash", "card", "online"];
    if (
      updateData.paymentMethod &&
      !validPaymentMethods.includes(updateData.paymentMethod)
    ) {
      await transaction.rollback();
      return { status: 400, success: false, message: "Invalid payment method" };
    }

    // Fetch orders based on single or multiple checkout
    let orders = [];

    if (orderId && !checkoutAll) {
      // Single order checkout
      const order = await orderModel.findOne({
        where: {
          id: orderId,
          tableId,
          status: { [Op.notIn]: ["completed", "cancelled"] },
        },
        include: [{ model: orderItemModel, as: "orderItems" }],
        transaction,
      });
      if (!order) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: "Order not found or not active",
        };
      }
      orders = [order];
    } else {
      // Multiple order checkout
      orders = await orderModel.findAll({
        where: {
          tableId,
          ...(sessionId ? { sessionId } : {}),
          status: { [Op.notIn]: ["completed", "cancelled"] },
        },
        include: [{ model: orderItemModel, as: "orderItems" }],
        transaction,
      });
      if (!orders || orders.length === 0) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: "No active orders found for this table",
        };
      }
    }

    // Check for already processed orders
    const invalidOrders = orders.filter(
      (order) =>
        ["paid", "failed"].includes(order.paymentStatus) ||
        ["completed", "cancelled"].includes(order.status),
    );
    if (invalidOrders.length > 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Some orders are already processed",
      };
    }

    // Calculate totalAmount for each order and combined total
    let combinedTotalAmount = 0;
    for (const order of orders) {
      const orderTotal = order.orderItems.reduce((total, item) => {
        const itemTotal =
          Number(item.subtotal) ||
          Number(item.price) * Number(item.quantity) -
            Number(item.discount || 0);
        return total + itemTotal;
      }, 0);

      if (isNaN(orderTotal) || orderTotal < 0) {
        await transaction.rollback();
        return {
          status: 500,
          success: false,
          message: `Invalid total amount for order ${order.id}`,
        };
      }

      combinedTotalAmount += orderTotal;
      await order.update({ totalAmount: orderTotal }, { transaction });
    }

    let finalCustomerId = null;
    let customer = null;

    // Handle existing customer
    if (customerId) {
      customer = await customerModel.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return { status: 404, success: false, message: "Customer not found" };
      }
      finalCustomerId = customer.id;
    }

    // Handle new customer creation
    if (customerDetails) {
      customer = await customerModel.create(
        { ...customerDetails, loyaltyPoints: 0 },
        { transaction },
      );
      if (!customer) {
        await transaction.rollback();
        return {
          status: 500,
          success: false,
          message: "Failed to create customer",
        };
      }
      finalCustomerId = customer.id;
    }

    // Award loyalty points: floor(amount / 100)
    const loyaltyPointsAdded = await awardLoyaltyPoints({
      customerId: finalCustomerId,
      amount: combinedTotalAmount,
      transaction,
      isGuestOrder,
    });

    // Update all orders and create revenue entries
    const updatedOrders = [];
    const revenueEntries = [];
    for (const order of orders) {
      await order.update(
        {
          ...updateData,
          status: "completed",
          paymentStatus: "paid",
          orderFinishTime: new Date(),
          customerId: finalCustomerId,
          isGuestOrder,
          totalAmount: order.totalAmount,
        },
        { transaction },
      );

      // Create revenue entry for each order
      const revenue = await Revenue.create(
        {
          amount: order.totalAmount,
          paymentMethod: updateData.paymentMethod || "cash",
          cash_or_credit: updateData.cashOrCredit || "cash",
          customerId: finalCustomerId,
          userId: req.user.id, // Assuming user ID is available in req.user
          remarks: updateData.remarks || `Revenue from order ${order.id}`,
        },
        { transaction },
      );

      updatedOrders.push({ ...order.toJSON(), totalAmount: order.totalAmount });
      revenueEntries.push(revenue);
    }

    // Check for other active orders
    const stillOrderInTable = await orderModel.findOne({
      where: {
        tableId,
        sessionId: sessionId || { [Op.ne]: null },
        status: { [Op.notIn]: ["completed", "cancelled"] },
        id: { [Op.notIn]: orders.map((o) => o.id) },
      },
      transaction,
    });

    // Free table if no other active orders
    if (!stillOrderInTable) {
      await tableModel.update(
        {
          status: "available",
          sessionId: null,
          sessionStartTime: null,
        },
        {
          where: { id: tableId },
          transaction,
        },
      );
    }

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: `Checked out ${orders.length} order(s) successfully`,
      data: {
        orders: updatedOrders,
        // revenueEntries, // Include revenue entries in response
        combinedTotalAmount,
        loyaltyPointsAdded,
      },
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in checkoutOrder:", error.message);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
    };
  }
};

const getOrderById = async (req) => {
  const { id } = req.params;

  try {
    const order = await orderModel.findByPk(id, {
      include: [
        {
          model: orderItemModel,
          as: "orderItems",
          include: [
            {
              model: productModel,
              as: "product",
              include: [{ model: productMediaModel, as: "mediaArr" }],
            },
          ],
        },
        {
          model: customerModel,
          as: "customer",
        },
        {
          model: tableModel,
          as: "table",
        },
      ],
    });

    if (!order) {
      return { status: 404, success: false, message: "Order not found" };
    }

    return {
      status: 200,
      success: true,
      message: "Order retrieved successfully",
      data: order,
    };
  } catch (error) {
    console.error("Get order by ID error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const list = async (req) => {
  try {
    let {
      limit,
      page,
      username,
      customerId,
      amount,
      paymentMethod,
      cash_or_credit = "all",
      sort,
      start,
      end,
    } = req.query;

    const filters = {};
    const include = [
      {
        model: userModel,
        as: "user",
        attributes: ["id", "username"],
      },
      {
        model: customerModel,
        as: "customer",
        attributes: ["id", "email", "firstName"],
      },
    ];
    const order = [["updatedAt", "DESC"]];
    const aggregates = [
      { column: "amount", function: "SUM", alias: "grandTotal" },
    ];

    if (paymentMethod) filters.paymentMethod = String(paymentMethod);

    if (cash_or_credit === "cash" || cash_or_credit === "credit")
      filters.cash_or_credit = cash_or_credit;

    if (start && end) {
      const startDate = startOfDay(parseISO(start)); // e.g., 2025-08-29T00:00:00.000Z
      const endDate = endOfDay(parseISO(end));

      filters.createdAt = { [Op.between]: [startDate, endDate] };
    }

    if (sort) {
      if (sort === "price") order.push(["amount", "DESC"]);
      else if (sort === "latest") order.push(["createdAt", "DESC"]);
    }

    const result = await paginateWithAggregate(revenueModel, {
      limit,
      page,
      filters,
      include,
      order,
      aggregates,
    });

    return {
      status: 200,
      success: true,
      message: "Revenue retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("List revenue error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const groupedList = async (req) => {
  try {
    let {
      limit = 10,
      page = 1,
      username,
      customerId,
      amount,
      paymentMethod,
      cash_or_credit = "all",
      sort,
      start,
      end,
    } = req.query;

    const filters = {};

    // Apply filters
    if (paymentMethod) {
      filters.paymentMethod = {
        [Op.in]: Array.isArray(paymentMethod) ? paymentMethod : [paymentMethod],
      };
    }

    if (cash_or_credit === "cash" || cash_or_credit === "credit") {
      filters.cash_or_credit = cash_or_credit;
    }

    if (start && end) {
      const startDate = startOfDay(parseISO(start));
      const endDate = endOfDay(parseISO(end));
      filters.createdAt = { [Op.between]: [startDate, endDate] };
    }

    if (username) {
      filters["$user.username$"] = { [Op.iLike]: `%${username}%` };
    }

    if (customerId) {
      filters.customerId = parseInt(customerId);
    }

    if (amount) {
      filters.amount = parseFloat(amount);
    }

    const includes = [
      {
        model: userModel,
        as: "user",
        attributes: [],
        required: false,
      },
      {
        model: customerModel,
        as: "customer",
        attributes: [],
        required: false,
      },
      {
        model: accountModel,
        as: "account",
        attributes: [],
        required: true,
      },
    ];

    // Get total number of distinct days
    const totalDaysResult = await revenueModel.findAll({
      attributes: [
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn(
              "DISTINCT",
              Sequelize.fn("DATE", Sequelize.col("Revenue.createdAt")),
            ),
          ),
          "totalDays",
        ],
      ],
      where: filters,
      include: includes,
      raw: true,
    });

    const totalDays = parseInt(totalDaysResult[0]?.totalDays || 0);

    // Order setup
    let dailyOrder = [
      [Sequelize.fn("DATE", Sequelize.col("Revenue.createdAt")), "DESC"],
    ];
    if (sort) {
      if (sort === "price") {
        dailyOrder = [
          [Sequelize.fn("SUM", Sequelize.col("Revenue.amount")), "DESC"],
        ];
      } else if (sort === "latest") {
        dailyOrder = [
          [Sequelize.fn("DATE", Sequelize.col("Revenue.createdAt")), "DESC"],
        ];
      }
    }

    // Query for daily revenues
    const dailyRevenues = await sequelize.models.Revenue.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("Revenue.createdAt")), "day"],
        [Sequelize.fn("SUM", Sequelize.col("Revenue.amount")), "dailyTotal"],
      ],
      where: filters,
      include: includes,
      group: [Sequelize.fn("DATE", Sequelize.col("Revenue.createdAt"))],
      order: dailyOrder,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      raw: true,
    });

    // Get grand total over the entire filtered range
    const grandTotalResult = await sequelize.models.Revenue.sum("amount", {
      where: filters,
      include: includes,
    });

    const result = {
      dailyRevenues: dailyRevenues.map((d) => ({
        day: d.day,
        dailyTotal: parseFloat(d.dailyTotal).toFixed(2),
      })),
      totalDays,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalDays / parseInt(limit)),
      grandTotal: parseFloat(grandTotalResult || 0).toFixed(2),
    };

    return {
      status: 200,
      success: true,
      message: "Daily revenues retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("List daily revenues error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

// Sum total revenue with filter support
const totalRevenue = async (req) => {
  try {
    let {
      username,
      customerId,
      amount,
      paymentMethod,
      cash_or_credit = "all",
      start,
      end,
    } = req.query;

    const filters = {};

    // Apply filters similar to groupedList
    if (paymentMethod) {
      filters.paymentMethod = {
        [Op.in]: Array.isArray(paymentMethod) ? paymentMethod : [paymentMethod],
      };
    }

    if (cash_or_credit === "cash" || cash_or_credit === "credit") {
      filters.cash_or_credit = cash_or_credit;
    }

    if (start && end) {
      const startDate = startOfDay(parseISO(start));
      const endDate = endOfDay(parseISO(end));
      filters.createdAt = { [Op.between]: [startDate, endDate] };
    }

    if (username) {
      filters["$user.username$"] = { [Op.iLike]: `%${username}%` };
    }

    if (customerId) {
      filters.customerId = parseInt(customerId);
    }

    if (amount) {
      filters.amount = parseFloat(amount);
    }

    const includes = [
      {
        model: userModel,
        as: "user",
        attributes: [],
        required: false,
      },
      {
        model: customerModel,
        as: "customer",
        attributes: [],
        required: false,
      },
    ];

    const total = await revenueModel.sum("amount", {
      where: filters,
      include: includes,
    });

    return {
      status: 200,
      success: true,
      message: "Total revenue retrieved successfully",
      data: {
        total: parseFloat(total || 0),
      },
    };
  } catch (error) {
    console.error("Total revenue error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

const updateOrderStatus = async (req) => {
  const { id } = req.params;
  const { status, paymentStatus, paymentMethod } = req.body;

  return withTransaction(async (t) => {
    const order = await orderModel.findByPk(id, {
      include: [
        {
          model: customerModel,
          as: "customer",
        },
      ],
      transaction: t,
    });

    if (!order) {
      return { status: 404, success: false, message: "Order not found" };
    }

    if (paymentStatus && ["paid", "failed"].includes(order.paymentStatus)) {
      return {
        status: 400,
        success: false,
        message: "Payment status is already finalized",
      };
    }

    if (status && ["completed", "cancelled"].includes(order.status)) {
      return {
        status: 400,
        success: false,
        message: "Order status is already finalized",
      };
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    await order.update(updateData, { transaction: t });

    return {
      status: 200,
      success: true,
      message: "Order updated successfully",
      data: order,
    };
  });
};

// this is for waiters to mark order items as served
const bulkServeOrderItems = async (req) => {
  const { orderItemIds } = req.body; // array of orderItem ids

  try {
    // fetch order items
    const orderItems = await orderItemModel.findAll({
      where: { id: orderItemIds, status: "ready" },
    });

    if (orderItems.length === 0) {
      return {
        status: 404,
        success: false,
        message: "Order items not found or not ready yet",
      };
    }

    await Promise.all(
      orderItems.map((item) => item.update({ status: "served" })),
    );

    return {
      status: 200,
      success: true,
      message: "Order items served successfully",
      data: orderItems,
    };
  } catch (error) {
    throw error;
  }
};

const getRevenueById = async (req) => {
  try {
    const { id } = req.params;
    const include = [
      {
        model: userModel,
        as: "user",
        attributes: ["id", "username"],
      },
      {
        model: customerModel,
        as: "customer",
        attributes: ["id", "email", "firstName", "lastName", "mobileNo"],
      },
    ];

    const revenue = await revenueModel.findByPk(id, { include });
    if (!revenue) {
      return {
        status: 404,
        success: false,
        message: "Revenue entry not found",
      };
    }

    return {
      status: 200,
      success: true,
      message: "Revenue retrieved successfully",
      data: revenue,
    };
  } catch (error) {
    throw error;
  }
};

// this is for departments to update order item status
const updateOrderItemsStatus = async (req) => {
  let { orderItemIds } = req.body;
  const { status } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const orderItem = await orderItemModel.findOne({
      where: { id: orderItemIds },
      transaction,
    });

    if (!orderItem) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Order item(s) not found",
      };
    }

    // enforce transitions: pending->preparing, preparing->ready
    if (
      (status === "preparing" && orderItem.status !== "pending") ||
      (status === "ready" && orderItem.status !== "preparing")
    ) {
      transaction.rollback();
      return {
        status: 400,
        success: false,
        message:
          "Some order items could not be updated due to invalid transitions",
      };
    }
    await orderItemModel.update(
      {
        status,
      },
      {
        where: {
          id: orderItem.id,
        },
      },
      transaction,
    );

    await transaction.commit();
    return {
      status: 200,
      success: true,
      message: `Order item(s) updated to ${status} successfully`,
      data: orderItem,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// for waiter , department and all
const getOrderItems = async (req) => {
  try {
    let { limit, page, status } = req.query;
    const filters = {};
    const include = [];

    if (status) {
      filters.status = String(status);
    }

    const result = await paginate(orderItemModel, {
      limit,
      page,
      filters,
      include,
    });

    if (!result) {
      return {
        status: 500,
        success: false,
        message: `Order Items List Failed`,
      };
    }
    return {
      status: 200,
      success: true,
      message: `Order Items successfully`,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const revenueByAccount = async (req) => {
  try {
    let { startDate, endDate, accountId } = req.query;

    const filters = {};

    if (startDate && endDate) {
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      filters.createdAt = { [Op.between]: [start, end] };
    }

    if (accountId) {
      filters.accountId = parseInt(accountId);
    }

    const includes = [
      {
        model: accountModel,
        as: "account",
        attributes: ["id", "name", "accountType"],
        required: true,
      },
    ];

    const revenuesByAccount = await sequelize.models.Revenue.findAll({
      attributes: [
        "accountId",
        [sequelize.col("account.name"), "accountName"],
        [sequelize.col("account.accountType"), "accountType"],
        [sequelize.fn("SUM", sequelize.col("Revenue.amount")), "totalRevenue"],
        [sequelize.fn("COUNT", sequelize.col("Revenue.id")), "transactionCount"],
      ],
      where: filters,
      include: includes,
      group: ["accountId", sequelize.col("account.name"), sequelize.col("account.accountType")],
      order: [[sequelize.fn("SUM", sequelize.col("Revenue.amount")), "DESC"]],
      raw: true,
    });

    const grandTotal = await sequelize.models.Revenue.sum("amount", {
      where: filters,
      include: includes,
    });

    return {
      status: 200,
      success: true,
      message: "Revenue by account retrieved successfully",
      data: {
        revenues: revenuesByAccount.map((r) => ({
          accountId: r.accountId,
          accountName: r.accountName,
          accountType: r.accountType,
          totalRevenue: parseFloat(r.totalRevenue || 0),
          transactionCount: parseInt(r.transactionCount || 0),
        })),
        grandTotal: parseFloat(grandTotal || 0),
      },
    };
  } catch (error) {
    console.error("Revenue by account error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve revenue by account",
      error: error.message,
    };
  }
};

const todayRevenue = async (req) => {
  try {
    const { start, end } = req.query;
    
    let startDate, endDate, targetDate;
    
    if (start && end) {
      const dateRange = getLocalDateRange(start, end);
      startDate = dateRange.start;
      endDate = dateRange.end;
      targetDate = start;
    } else {
      targetDate = new Date().toISOString().split("T")[0];
      const dateRange = getLocalDateRange(targetDate, targetDate);
      startDate = dateRange.start;
      endDate = dateRange.end;
    }

    const filters = {
      createdAt: { [Op.between]: [startDate, endDate] },
    };

    const includes = [
      {
        model: accountModel,
        as: "account",
        attributes: ["id", "name", "accountType"],
        required: false,
      },
    ];

    const total = await revenueModel.sum("amount", {
      where: filters,
      include: includes,
    });

    const count = await revenueModel.count({
      where: filters,
      include: includes,
    });

    const revenuesByAccount = await sequelize.models.Revenue.findAll({
      attributes: [
        "accountId",
        [sequelize.col("account.name"), "accountName"],
        [sequelize.col("account.accountType"), "accountType"],
        [sequelize.fn("SUM", sequelize.col("Revenue.amount")), "totalRevenue"],
        [sequelize.fn("COUNT", sequelize.col("Revenue.id")), "transactionCount"],
      ],
      where: filters,
      include: includes,
      group: ["accountId", sequelize.col("account.name"), sequelize.col("account.accountType")],
      order: [[sequelize.fn("SUM", sequelize.col("Revenue.amount")), "DESC"]],
      raw: true,
    });

    return {
      status: 200,
      success: true,
      message: "Today's revenue retrieved successfully",
      data: {
        date: targetDate,
        totalRevenue: parseFloat(total || 0),
        transactionCount: count,
        revenues: revenuesByAccount.map((r) => ({
          accountId: r.accountId,
          accountName: r.accountName || "Unknown",
          accountType: r.accountType || "unknown",
          totalRevenue: parseFloat(r.totalRevenue || 0),
          transactionCount: parseInt(r.transactionCount || 0),
        })),
      },
    };
  } catch (error) {
    console.error("Today's revenue error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to retrieve today's revenue",
      error: error.message,
    };
  }
};

module.exports = {
  list,
  groupedList,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenueById,
  totalRevenue,
  revenueByAccount,
  todayRevenue,
};
