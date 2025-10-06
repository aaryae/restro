const { Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");
const { generateUUID } = require("../../utils/uuidGenerator");

const {
  customerModel,
  orderModel,
  orderItemModel,
  productModel,
  productCategoryModel,
  tableModel,
  productMediaModel,
  accountModel,
  revenueModel,
  openItemModel,
  kotModel,
  departmentModel,
  sequelize,
} = require("../../models");

const { withTransaction } = require("../../helpers/order/transaction");

const paginate = require("../../utils/paginate");

// Sum paid sales by product category for bar charts
const categorySalesSummary = async (req) => {
  try {
    const { start, end } = req.query;

    const whereOrder = {
      status: "completed",
      paymentStatus: "paid",
    };
    if (start && end) {
      const startDate = startOfDay(parseISO(start));
      const endDate = endOfDay(parseISO(end));
      whereOrder.orderFinishTime = { [Op.between]: [startDate, endDate] };
    }

    const rows = await orderItemModel.findAll({
      attributes: [
        [sequelize.col("product.product_category.name"), "name"],
        [sequelize.fn("SUM", sequelize.col("subtotal")), "amount"],
      ],
      include: [
        {
          model: productModel,
          as: "product",
          attributes: [],
          include: [
            {
              model: productCategoryModel,
              as: "product_category",
              attributes: [],
            },
          ],
        },
        {
          model: orderModel,
          as: "order",
          attributes: [],
          where: whereOrder,
          required: true,
        },
      ],
      where: {
        status: { [Op.ne]: "cancelled" },
      },
      group: ["product.product_category.id", "product.product_category.name"],
      raw: true,
    });

    const data = rows.map((row) => ({
      name: row.name,
      amount: Number(row.amount) || 0,
    }));
    return {
      status: 200,
      success: true,
      message: "Category sales summary retrieved successfully",
      data,
    };
  } catch (error) {
    console.error("Category sales summary error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
// Top 5 products by total sold amount (paid & completed), not by times sold
const productTopSales = async (req) => {
  try {
    const { start, end, limit = 5 } = req.query;

    const whereOrder = {
      status: "completed",
      paymentStatus: "paid",
    };
    if (start && end) {
      const startDate = startOfDay(parseISO(start));
      const endDate = endOfDay(parseISO(end));
      whereOrder.orderFinishTime = { [Op.between]: [startDate, endDate] };
    }

    const rows = await orderItemModel.findAll({
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("subtotal")), "amount"],
      ],
      include: [
        { model: productModel, as: "product", attributes: ["name"] },
        {
          model: orderModel,
          as: "order",
          attributes: [],
          where: whereOrder,
          required: true,
        },
      ],
      where: { status: { [Op.ne]: "cancelled" } },
      group: ["productId", "product.id", "product.name"],
      order: [[sequelize.literal("amount"), "DESC"]],
      limit: Math.max(1, parseInt(limit) || 5),
      raw: true,
    });

    const data = rows.map((r) => ({
      name: r["product.name"],
      amount: Number(r.amount) || 0,
    }));

    return {
      status: 200,
      success: true,
      message: "Top product sales retrieved successfully",
      data,
    };
  } catch (error) {
    console.error("Top product sales error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
const createOrder = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderType, tableId, orderItems = [] } = req.body;
    let table = null;
    let sessionId = null;

    // Handle table and session for dine-in orders
    if (orderType === "dineIn") {
      table = await tableModel.findByPk(tableId, { transaction });
      if (!table) {
        await transaction.rollback();
        return { status: 404, success: false, message: "Table not found" };
      }

      if (table.status === "available") {
        sessionId = generateUUID();
        await table.update(
          {
            status: "occupied",
            sessionId,
            sessionStartTime: new Date(),
          },
          { transaction },
        );
      } else {
        sessionId = table.sessionId;
      }
    }

    // Group order items by department
    const itemsByDepartment = orderItems.reduce((acc, item) => {
      const departmentId = item.departmentId;
      if (!acc[departmentId]) {
        acc[departmentId] = [];
      }
      acc[departmentId].push(item);
      return acc;
    }, {});

    // Generate daily base KOT number
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Get the count of KOTs created today to generate the next base KOT number
    const todayKotsCount = await kotModel.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
      transaction,
    });

    let baseKotNo = todayKotsCount + 1;

    // Create the order
    const order = await orderModel.create(
      {
        ...req.body,
        sessionId,
        orderStartTime: new Date(),
      },
      { transaction },
    );

    let totalAmount = 0;
    const kotRecords = [];

    // Create KOTs for each department
    for (const departmentId of Object.keys(itemsByDepartment)) {
      const items = itemsByDepartment[departmentId];

      // Use the incremented base KOT number for this department
      const kotNumber = baseKotNo;

      // Create KOT record
      const kot = await kotModel.create(
        {
          orderId: order.id,
          departmentId,
          kotNumber,
          status: "pending",
        },
        { transaction },
      );

      // Store KOT for associating with order items
      kotRecords.push(kot);
      baseKotNo++; // Increment for the next department

      // Process order items for this department
      for (const item of items) {
        const product = item.productId
          ? await productModel.findByPk(item.productId, { transaction })
          : await openItemModel.findByPk(item.openItemId, { transaction });

        if (!product) {
          await transaction.rollback();
          return {
            status: 404,
            success: false,
            message: `Item with ID ${item.productId || item.openItemId} not found`,
          };
        }

        const price = product.price || item.price; // Use item.price for open items if needed
        const subtotal = price * item.quantity - (item.discount || 0);
        totalAmount += subtotal;

        await orderItemModel.create(
          {
            ...item,
            orderId: order.id,
            price,
            subtotal,
            departmentId,
            kotId: kot.id, // Associate with the KOT
          },
          { transaction },
        );
      }
    }

    // Update order total amount
    await order.update({ totalAmount }, { transaction });

    await transaction.commit();

    return {
      status: 201,
      success: true,
      message: "Order created successfully",
      data: {
        order,
        kots: kotRecords,
      },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updateOrderItems = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { orderItems = [] } = req.body;

    const order = await orderModel.findByPk(orderId, {
      include: [{ model: orderItemModel, as: "orderItems" }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return { status: 404, success: false, message: "Order not found" };
    }
    const newItems = orderItems.filter((i) => !i.id);
    const oldItems = orderItems.filter((i) => i.id);
    for (const incoming of oldItems) {
      const existing = order.orderItems.find((oi) => oi.id === incoming.id);
      if (!existing) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: `Order item ${incoming.id} not found`,
        };
      }

      // Check for status change
      if (incoming.status && incoming.status !== existing.status) {
        if (incoming.status === "cancelled") {
          if (existing.status === "preparing") {
            await transaction.rollback();
            return {
              status: 400,
              success: false,
              message: `Cannot cancel item ${existing.id}, already in preparing`,
            };
          }
          await existing.update(
            { status: "cancelled", subtotal: 0 },
            { transaction },
          );
          continue; // skip quantity check since it's cancelled
        }
      }

      // Check for quantity change
      if (
        incoming.quantity !== undefined &&
        incoming.quantity !== existing.quantity
      ) {
        if (
          incoming.quantity < existing.quantity &&
          existing.status === "preparing"
        ) {
          await transaction.rollback();
          return {
            status: 400,
            success: false,
            message: `Cannot decrease quantity for item ${existing.id}, already in preparing`,
          };
        }

        const newSubtotal = existing.price * incoming.quantity;
        await existing.update(
          { quantity: incoming.quantity, subtotal: newSubtotal },
          { transaction },
        );
      }
    }
    if (newItems.length > 0) {
      for (const item of newItems) {
        const product = await productModel.findByPk(item.productId, {
          transaction,
        });
        if (!product) {
          await transaction.rollback();
          return {
            status: 404,
            success: false,
            message: `Product with ID ${item.productId} not found`,
          };
        }
        const subtotal = product.price * item.quantity;
        await orderItemModel.create(
          {
            ...item,
            orderId: order.id,
            price: product.price,
            departmentId: product.departmentId,
            subtotal,
          },
          { transaction },
        );
      }
    }

    // Recalculate order total (exclude cancelled)
    const validItems = await orderItemModel.findAll({
      where: { orderId, status: { [Op.ne]: "cancelled" } },
      transaction,
    });

    const totalAmount = validItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    await order.update({ totalAmount }, { transaction });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Order items updated successfully",
      data: order,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getTableActiveOrders = async (req) => {
  const { id: tableId } = req.params;

  try {
    const table = await tableModel.findByPk(tableId);

    if (!table) {
      return { status: 404, success: false, message: "Table not found" };
    }

    if (!table.sessionId) {
      return {
        status: 200,
        success: true,
        message: "No active session for this table",
        data: null,
      };
    }

    const orders = await orderModel.findAll({
      where: {
        tableId: tableId,
        sessionId: table.sessionId,
        status: { [Op.notIn]: ["completed", "cancelled"] },
      },
      include: [
        {
          model: orderItemModel,
          as: "orderItems",
          where:{
            status:{[Op.notIn]: ["completed", "cancelled"] }
          },
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
          attributes: ["id", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const sessionTotal = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount),
      0,
    );

    return {
      status: 200,
      success: true,
      message: "Active orders retrieved successfully",
      data: {
        table: {
          id: table.id,
          tableNo: table.tableNo,
          status: table.status,
          sessionId: table.sessionId,
          sessionStartTime: table.sessionStartTime,
        },
        orders,
        sessionTotal,
      },
    };
  } catch (error) {
    console.error("Get table active orders error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

// const { Op } = require("sequelize");

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
      accountId, // New optional field to allow specifying accountId
      orderItemIds, // Optional: selective checkout of specific order items across orders
      ...updateData
    } = req.body;

    console.log(`******************\n${orderItemIds}\n****************`);

    // For dine-in flow, tableId is used; for takeaway, tableId may be missing/ignored
    const hasTable =
      !!tableId &&
      tableId !== "0" &&
      tableId !== "null" &&
      tableId !== "undefined";

    // Validate paymentMethod if provided
    const validPaymentMethods = ["cash", "card", "online", "cheque"];
    if (
      updateData.paymentMethod &&
      !validPaymentMethods.includes(updateData.paymentMethod)
    ) {
      await transaction.rollback();
      return { status: 400, success: false, message: "Invalid payment method" };
    }

    // If selective checkout by order items is requested, handle that path
    if (Array.isArray(orderItemIds) && orderItemIds.length > 0) {
      // Validate and fetch target items belonging to active orders on this table
      const targetItems = await orderItemModel.findAll({
        where: { id: { [Op.in]: orderItemIds } },
        include: [
          {
            model: orderModel,
            as: "order",
            where: {
              tableId,
              status: { [Op.notIn]: ["completed", "cancelled"] },
            },
          },
        ],
        transaction,
      });

      if (!targetItems || targetItems.length === 0) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: "No matching order items found for selective checkout",
        };
      }

      // Group items by order
      const itemsByOrder = targetItems.reduce((acc, item) => {
        const oid = item.orderId;
        if (!acc[oid]) acc[oid] = [];
        acc[oid].push(item);
        return acc;
      }, {});

      // Determine account to credit (reuse logic below)
      let selectedAccountId = accountId;
      if (!selectedAccountId) {
        let account = await accountModel.findOne({
          where: { isDefault: true, status: "active" },
          transaction,
        });
        if (!account) {
          const pm = updateData.paymentMethod || "cash";
          const accountTypeMap = {
            cash: "cash",
            card: "bank",
            cheque: "bank",
            online: "wallet",
          };
          const accountType = accountTypeMap[pm] || "cash";
          account = await accountModel.findOne({
            where: { accountType, isDefault: true, status: "active" },
            transaction,
          });
          if (!account) {
            account = await accountModel.findOne({
              where: { accountType, status: "active" },
              transaction,
            });
          }
        }
        if (!account) {
          await transaction.rollback();
          return {
            status: 400,
            success: false,
            message: "No active account available for checkout",
          };
        }
        selectedAccountId = account.id;
      } else {
        const account = await accountModel.findByPk(selectedAccountId, {
          transaction,
        });
        if (!account || account.status !== "active") {
          await transaction.rollback();
          return {
            status: 400,
            success: false,
            message: `Invalid or inactive account ID: ${selectedAccountId}`,
          };
        }
      }

      const updatedOrders = [];
      const revenueEntries = [];
      let combinedTotalAmount = 0;

      // For each order, compute subset total and mark those items completed
      for (const [oid, items] of Object.entries(itemsByOrder)) {
        // Compute subset amount for these items (use subtotal if available, else price*qty - discount)
        const subsetTotal = items.reduce((sum, it) => {
          const line =
            Number(it.subtotal) ||
            Number(it.price) * Number(it.quantity) - Number(it.discount || 0);
          return sum + (isNaN(line) ? 0 : line);
        }, 0);

        // Mark these specific items as completed
        const ids = items.map((it) => it.id);
        await orderItemModel.update(
          { status: "completed" },
          {
            where: {
              id: { [Op.in]: ids },
              status: { [Op.notIn]: ["completed", "cancelled"] },
            },
            validate: false,
            transaction,
          },
        );

        // Update KOTs that are now fully completed/cancelled
        const touchedKotIds = Array.from(
          new Set(items.map((it) => it.kotId).filter(Boolean)),
        );
        if (touchedKotIds.length > 0) {
          const rows = await orderItemModel.findAll({
            attributes: ["kotId"],
            where: {
              kotId: { [Op.in]: touchedKotIds },
              status: { [Op.notIn]: ["completed", "cancelled"] },
            },
            group: ["kotId"],
            transaction,
            raw: true,
          });
          const incompleteKot = new Set(rows.map((r) => r.kotId));
          const completeKotIds = touchedKotIds.filter(
            (kid) => !incompleteKot.has(kid),
          );
          if (completeKotIds.length > 0) {
            await kotModel.update(
              { status: "completed" },
              {
                where: { id: { [Op.in]: completeKotIds } },
                validate: false,
                transaction,
              },
            );
          }
        }

        // If all items of the order are now completed or cancelled, mark order completed
        const remaining = await orderItemModel.count({
          where: {
            orderId: oid,
            status: { [Op.notIn]: ["completed", "cancelled"] },
          },
          transaction,
        });
        const orderRecord = await orderModel.findByPk(oid, { transaction });
        if (remaining === 0) {
          await orderRecord.update(
            {
              status: "completed",
              paymentStatus: "paid",
              orderFinishTime: new Date(),
            },
            { transaction },
          );
        }

        // Create revenue entry for this subset
        if (subsetTotal > 0) {
          const revenue = await revenueModel.create(
            {
              amount: subsetTotal,
              paymentMethod: updateData.paymentMethod || "cash",
              cash_or_credit: updateData.cashOrCredit || "cash",
              customerId: orderRecord.customerId || null,
              userId: req.user.id,
              accountId: selectedAccountId,
              remarks:
                updateData.remarks ||
                `Revenue from partial checkout of order ${oid}`,
            },
            { transaction },
          );
          revenueEntries.push(revenue);
          updatedOrders.push(orderRecord);
          combinedTotalAmount += subsetTotal;
        }
      }

      // Free table if no other active orders remain
      if (hasTable) {
        const stillOrderInTable = await orderModel.findOne({
          where: {
            tableId,
            sessionId: sessionId || { [Op.ne]: null },
            status: { [Op.notIn]: ["completed", "cancelled"] },
          },
          transaction,
        });
        if (!stillOrderInTable) {
          await tableModel.update(
            { status: "available", sessionId: null, sessionStartTime: null },
            { where: { id: tableId }, transaction },
          );
        }
      }

      await transaction.commit();
      return {
        status: 200,
        success: true,
        message: `Selective checkout completed for ${targetItems.length} item(s) across ${Object.keys(itemsByOrder).length} order(s)`,
        data: {
          orders: updatedOrders,
          revenueEntries,
          combinedTotalAmount,
        },
      };
    }

    // Fetch orders based on single or multiple checkout
    let orders = [];

    if (orderId && !checkoutAll) {
      // Single order checkout
      const order = await orderModel.findOne({
        where: {
          id: orderId,
          ...(hasTable ? { tableId } : {}),
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
      if (hasTable) {
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
      } else {
        // Takeaway: checkoutAll without a table -> all active takeaway orders
        orders = await orderModel.findAll({
          where: {
            orderType: { [Op.like]: "%takeaway%" },
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
            message: "No active takeaway orders found",
          };
        }
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

    // Calculate and update loyalty points
    if (!isGuestOrder && finalCustomerId && combinedTotalAmount > 0) {
      const pointsToAdd = Math.floor(combinedTotalAmount / 100);
      if (pointsToAdd > 0) {
        await customerModel.update(
          {
            loyaltyPoints: customer.loyaltyPoints + pointsToAdd,
          },
          {
            where: { id: finalCustomerId },
            transaction,
          },
        );
      }
    }

    // Determine the account for revenue (prioritize globally default active account)
    let selectedAccountId = accountId;
    if (!selectedAccountId) {
      // 1) Use a globally default active account if available
      let account = await accountModel.findOne({
        where: { isDefault: true, status: "active" },
        transaction,
      });
      // 2) Otherwise map paymentMethod to accountType and pick a default or any active of that type
      if (!account) {
        const paymentMethod = updateData.paymentMethod || "cash";
        const accountTypeMap = {
          cash: "cash",
          card: "bank",
          cheque: "bank",
          online: "wallet",
        };
        const accountType = accountTypeMap[paymentMethod] || "cash";
        account = await accountModel.findOne({
          where: { accountType, isDefault: true, status: "active" },
          transaction,
        });
        if (!account) {
          account = await accountModel.findOne({
            where: { accountType, status: "active" },
            transaction,
          });
        }
      }

      if (!account) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: `No active account available for checkout`,
        };
      }
      console.log(
        `[checkoutOrder] Using account ${account.id} (isDefault=${account.isDefault})`,
      );
      selectedAccountId = account.id;
    } else {
      // Validate provided accountId is active
      const account = await accountModel.findByPk(selectedAccountId, {
        transaction,
      });
      if (!account || account.status !== "active") {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: `Invalid or inactive account ID: ${selectedAccountId}`,
        };
      }
      console.log(
        `[checkoutOrder] Using provided account ${selectedAccountId}`,
      );
    }

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

      console.log(`******************\n ID ${req.user.id}\n ***************`);

      // Create revenue entry for each order
      const revenue = await revenueModel.create(
        {
          amount: order.totalAmount,
          paymentMethod: updateData.paymentMethod || "cash",
          cash_or_credit: updateData.cashOrCredit || "cash",
          customerId: finalCustomerId,
          userId: req.user.id, // Assuming user ID is available in req.user
          accountId: selectedAccountId, // Credit the selected account
          remarks: updateData.remarks || `Revenue from order ${order.id}`,
        },
        { transaction },
      );

      updatedOrders.push({ ...order.toJSON(), totalAmount: order.totalAmount });
      revenueEntries.push(revenue);
    }
    for (const order of orders) {
      // 1) Mark all non-cancelled and non-completed order items as completed
      await orderItemModel.update(
        { status: "completed" },
        {
          where: {
            orderId: order.id,
            status: { [Op.notIn]: ["completed", "cancelled"] },
          },
          validate: false,
          transaction,
        },
      );

      // 2) Complete KOTs that have all their items completed or cancelled
      const kots = await kotModel.findAll({
        where: { orderId: order.id },
        attributes: ["id"],
        transaction,
      });
      const kotIds = kots.map((k) => k.id);
      if (kotIds.length > 0) {
        // Find kotIds that still have any non-completed and non-cancelled items
        const rows = await orderItemModel.findAll({
          attributes: ["kotId"],
          where: {
            kotId: { [Op.in]: kotIds },
            status: { [Op.notIn]: ["completed", "cancelled"] },
          },
          group: ["kotId"],
          transaction,
          raw: true,
        });
        const incompleteKotIds = new Set(rows.map((r) => r.kotId));
        const completeKotIds = kotIds.filter((id) => !incompleteKotIds.has(id));
        if (completeKotIds.length > 0) {
          await kotModel.update(
            { status: "completed" },
            {
              where: { id: { [Op.in]: completeKotIds } },
              validate: false,
              transaction,
            },
          );
        }
      }
    }

    // Check for other active orders
    if (hasTable) {
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
    }

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: `Checked out ${orders.length} order(s) successfully`,
      data: {
        orders: updatedOrders,
        revenueEntries, // Include revenue entries in response
        combinedTotalAmount,
        loyaltyPointsAdded:
          !isGuestOrder && finalCustomerId
            ? Math.floor(combinedTotalAmount / 100)
            : 0,
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
  const { itemStatus } = req.query;

  try {
    const include = [
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
        ...(itemStatus && {
          where: {
            status: itemStatus.includes(',') 
              ? { [Op.in]: itemStatus.split(',').map(s => s.trim()) }
              : itemStatus === 'active'
                ? { [Op.notIn]: ["completed", "cancelled"] }
                : { [Op.eq]: itemStatus }
          }
        })
      },
      {
        model: customerModel,
        as: "customer",
      },
      {
        model: tableModel,
        as: "table",
      }
    ];

    const order = await orderModel.findByPk(id, { include });

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

const listOrders = async (req) => {
  try {
    let {
      limit,
      page,
      status,
      paymentStatus,
      paymentMethod,
      orderType,
      tableId,
      orderDate,
      sort,
      start,
      end,
    } = req.query;

    const filters = {};
    const include = [
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
      {
        model: customerModel,
        as: "customer",
        attributes: ["id", "email"],
      },
      {
        model: tableModel,
        as: "table",
        attributes: ["id", "tableNo"],
      },
    ];
    let order = [["updatedAt", "DESC"]];

    // if status is all, remove it from filters
    if (status && status !== "all") {
      // Handle comma-separated multiple status values
      if (status.includes(",")) {
        const statusArray = status.split(",").map((s) => s.trim());
        filters.status = { [Op.in]: statusArray };
      } else {
        filters.status = { [Op.like]: `%${status}%` };
      }
    }
    if (paymentStatus)
      filters.paymentStatus = { [Op.like]: `%${paymentStatus}%` };
    if (paymentMethod)
      filters.paymentMethod = { [Op.like]: `%${paymentMethod}%` };
    if (orderType) filters.orderType = { [Op.like]: `%${orderType}%` };
    if (tableId) filters.tableId = tableId;

    // if (orderDate) {
    //   const date = new Date(orderDate);
    //   const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    //   const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    //   filters.orderDate = { [Op.between]: [startOfDay, endOfDay] };
    // }

    if (start && end) {
      const startDate = startOfDay(parseISO(start)); // e.g., 2025-08-29T00:00:00.000Z
      const endDate = endOfDay(parseISO(end));
      filters.orderStartTime = { [Op.between]: [startDate, endDate] };
    }

    if (sort) {
      order = [];
      if (sort === "oldest") order.push(["orderStartTime", "ASC"]);
      else if (sort === "newest") order.push(["orderStartTime", "DESC"]);
    }

    const result = await paginate(orderModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    return {
      status: 200,
      success: true,
      message: "Orders retrieved successfully",
      data: result,
    };
  } catch (error) {
    console.error("List orders error:", error);
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
        {
          model: tableModel,
          as: "table",
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

    // If order is being cancelled, cascade cancel to order items and KOTs
    if (status === "cancelled") {
      // Cancel all order items and KOTs linked to this order
      await Promise.all([
        orderItemModel.update(
          { status: "cancelled" },
          {
            where: { orderId: order.id },
            validate: false, // skip hooks/validation for status-only updates
            transaction: t,
          },
        ),
        kotModel.update(
          { status: "cancelled" },
          {
            where: { orderId: order.id },
            validate: false,
            transaction: t,
          },
        ),
      ]);
    }

    // If order is being cancelled and it's a dine-in order with a table
    if (
      status === "cancelled" &&
      order.orderType === "dineIn" &&
      order.tableId
    ) {
      // Check if there are any other active orders for this table
      const activeOrdersCount = await orderModel.count({
        where: {
          tableId: order.tableId,
          status: {
            [Op.notIn]: ["completed", "cancelled"],
          },
          id: {
            [Op.ne]: order.id, // Exclude the current order being cancelled
          },
        },
        transaction: t,
      });

      // If no active orders remain, make the table available
      if (activeOrdersCount === 0) {
        await tableModel.update(
          { status: "available" },
          {
            where: { id: order.tableId },
            transaction: t,
          },
        );
      }
    }

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
        validate: false, // Skip validation for status-only updates
        transaction,
      },
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
      filters.status = {
        [Op.like]: `%${status}%`,
      };
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

// Helper function to handle KOT relationships when moving items
const handleKotRelationships = async (orderItems, newOrderId, transaction) => {
  const KotModel = sequelize.models.Kot;

  // Group items by their current KOT
  const itemsByKot = {};
  orderItems.forEach((item) => {
    const kotId = item.kotId;
    if (!itemsByKot[kotId]) {
      itemsByKot[kotId] = [];
    }
    itemsByKot[kotId].push(item);
  });

  for (const [kotId, kotItems] of Object.entries(itemsByKot)) {
    if (!kotId) continue; // Skip items without KOT

    const kot = await KotModel.findByPk(kotId, {
      include: [{ model: orderItemModel, as: "orderItems" }],
      transaction,
    });

    if (!kot) continue;

    // Get remaining items in the original KOT
    const remainingKotItems = kot.orderItems.filter(
      (item) => !kotItems.some((movedItem) => movedItem.id === item.id),
    );

    if (remainingKotItems.length === 0) {
      // All items moved from this KOT - move entire KOT
      await kot.update({ orderId: newOrderId }, { transaction });
    } else {
      // Partial move - create new KOT for moved items
      const newKot = await KotModel.create(
        {
          orderId: newOrderId,
          departmentId: kot.departmentId,
          kotNumber: await getNextKotNumber(kot.departmentId, transaction),
          status: "pending",
        },
        { transaction },
      );

      // Update moved items with new KOT ID
      await orderItemModel.update(
        { kotId: newKot.id },
        {
          where: { id: kotItems.map((item) => item.id) },
          transaction,
          validate: false,
        },
      );
    }
  }
};

// Helper function to get next KOT number for a department
const getNextKotNumber = async (departmentId, transaction) => {
  const KotModel = sequelize.models.Kot;

  const lastKot = await KotModel.findOne({
    where: { departmentId },
    order: [["kotNumber", "DESC"]],
    transaction,
  });

  return lastKot ? lastKot.kotNumber + 1 : 1;
};

const moveOrderItems = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { sourceTableId, destinationTableId, orderIds } = req.body;

    console.log(
      "Moving orders from table",
      sourceTableId,
      "to table",
      destinationTableId,
      "orders:",
      orderIds,
    );

    // Validate source and destination tables
    const sourceTable = await tableModel.findByPk(+sourceTableId, {
      transaction,
    });
    const destinationTable = await tableModel.findByPk(+destinationTableId, {
      transaction,
    });

    if (!sourceTable || !destinationTable) {
      return {
        status: 404,
        success: false,
        message: "Source or destination table not found",
      };
    }

    // Get orders with complete associations
    const orders = await orderModel.findAll({
      where: { id: orderIds },
      include: [
        {
          model: orderItemModel,
          as: "orderItems",
          include: [
            {
              model: productModel,
              as: "product",
            },
            {
              model: openItemModel,
              as: "openItem",
            },
            {
              model: kotModel,
              as: "kot",
            },
          ],
        },
        {
          model: kotModel,
          as: "kots",
        },
      ],
      transaction,
    });

    if (orders.length === 0) {
      return {
        status: 404,
        success: false,
        message: "No orders found",
      };
    }

    // Validate that all orders belong to the source table
    const invalidOrders = orders.filter(
      (order) => order.tableId !== +sourceTableId,
    );

    if (invalidOrders.length > 0) {
      return {
        status: 400,
        success: false,
        message: "Some orders don't belong to the source table",
      };
    }

    // Validate that orders are in movable status
    const nonMovableOrders = orders.filter((order) =>
      ["completed", "cancelled"].includes(order.status),
    );

    if (nonMovableOrders.length > 0) {
      return {
        status: 400,
        success: false,
        message: "Cannot move completed or cancelled orders",
      };
    }

    // Determine the sessionId to use based on destination table status
    let sessionIdToUse;
    if (destinationTable.status === "available") {
      // Generate new sessionId for new table session
      sessionIdToUse = generateUUID();
    } else if (destinationTable.status === "occupied") {
      // Use existing sessionId from occupied table
      sessionIdToUse = destinationTable.sessionId;
    }

    const movedOrders = [];

    // Move each order to destination table
    for (const order of orders) {
      console.log(`Moving order ${order.id} to table ${destinationTableId}`);

      // Update order with new table and determined sessionId
      await order.update(
        {
          tableId: destinationTableId,
          sessionId: sessionIdToUse,
        },
        { transaction },
      );

      movedOrders.push(order);
    }

    // Update table statuses
    const remainingActiveOrders = await orderModel.count({
      where: {
        tableId: sourceTableId,
        status: { [Op.notIn]: ["completed", "cancelled"] },
      },
      transaction,
    });

    if (remainingActiveOrders === 0) {
      // No active orders left on source table
      await sourceTable.update(
        {
          status: "available",
          sessionId: null,
          sessionStartTime: null,
        },
        { transaction },
      );
    }

    // Ensure destination table is occupied
    if (destinationTable.status === "available") {
      await destinationTable.update(
        {
          status: "occupied",
          sessionId: sessionIdToUse,
          sessionStartTime: new Date(),
        },
        { transaction },
      );
    } else if (destinationTable.status === "occupied") {
      // Update destination table's sessionStartTime to current time
      await destinationTable.update(
        {
          sessionStartTime: new Date(),
        },
        { transaction },
      );
    }

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: `Successfully moved ${movedOrders.length} order(s) to table ${destinationTable.tableNo}`,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("MoveOrderItems error:", error);
    return {
      status: 500,
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};

module.exports = {
  getTableActiveOrders,
  getOrderById,
  listOrders,
  updateOrderStatus,
  createOrder,
  updateOrderItems,
  bulkServeOrderItems,
  checkoutOrder,
  getOrderItems,
  updateOrderItemsStatus,
  categorySalesSummary,
  productTopSales,
  moveOrderItems,
};
