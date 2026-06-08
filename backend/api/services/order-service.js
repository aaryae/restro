const { Op, Sequelize } = require("sequelize");
const { startOfDay, endOfDay, parseISO } = require("date-fns");
const { v4: uuidv4 } = require("uuid");
const { generateUUID } = require("../../utils/uuidGenerator");

const {
  accountModel,
  addonModel,
  customerModel,
  departmentModel,
  orderModel,
  orderItemModel,
  productModel,
  productCategoryModel,
  tableModel,
  productMediaModel,
  revenueModel,
  openItemModel,
  kotModel,
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
    const {
      orderType,
      tableId,
      orderItems = [],
      customerDetails,
      takeAwayName,
    } = req.body;
    let table = null;
    let sessionId = null;

    // Handle table and session for dine-in orders
    if (orderType === "dineIn") {
      table = await tableModel.findByPk(tableId, { transaction });
      if (!table) {
        await transaction.rollback();
        return {
          status: 404,
          success: false,
          message: "Table not found",
        };
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

    // Verify all departments exist before processing
    const departmentIds = [
      ...new Set(orderItems.map((item) => item.departmentId).filter(Boolean)),
    ];
    if (departmentIds.length > 0) {
      const existingDepartments = await departmentModel.findAll({
        where: { id: departmentIds },
        attributes: ["id"],
        raw: true,
        transaction,
      });

      const existingDepartmentIds = new Set(
        existingDepartments.map((d) => d.id),
      );
      const missingDepartmentIds = departmentIds.filter(
        (id) => !existingDepartmentIds.has(id),
      );

      if (missingDepartmentIds.length > 0) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: `The following department IDs do not exist: ${missingDepartmentIds.join(", ")}`,
        };
      }
    }

    // Process items and extract addons
    const mainItems = [];
    const addonItems = [];

    // First pass: process all items and generate tempIds
    for (const item of orderItems) {
      // Skip if it's an addon (shouldn't happen with proper validation)
      if (item.isAddon) continue;

      const mainItem = { ...item };

      // Generate a secure tempId for the main item using UUID v4
      mainItem.tempId = `temp_${uuidv4()}`;

      // Process addons if they exist
      if (mainItem.addons && mainItem.addons.length > 0) {
        // Create a copy of addons and clear the original
        const itemAddons = [...(mainItem.addons || [])];

        // Process each addon
        for (const addon of itemAddons) {
          if (!addon.addonId) continue; // Skip invalid addons

          addonItems.push({
            ...addon,
            parentTempId: mainItem.tempId, // Link to parent's tempId
            isAddon: true,
            departmentId: mainItem.departmentId, // Inherit department from parent
          });
        }

        // Remove addons from the main item
        delete mainItem.addons;
      }

      mainItems.push(mainItem);
    }

    // Create a map of tempId to main items for O(1) lookup
    const mainItemsMap = new Map(mainItems.map((item) => [item.tempId, item]));

    // Process addons and verify their parent items exist
    const processedAddonItems = [];
    const invalidAddons = [];

    for (const addon of addonItems) {
      const parentItem = mainItemsMap.get(addon.parentTempId);

      if (!parentItem) {
        invalidAddons.push(addon.addonId);
        continue;
      }

      // Ensure addon has all required fields
      processedAddonItems.push({
        addonId: addon.addonId,
        quantity: addon.quantity || 1,
        specialInstructions: addon.specialInstructions || "",
        isAddon: true,
        parentTempId: addon.parentTempId,
        departmentId: parentItem.departmentId, // Ensure department is inherited
      });
    }

    // If any addons had invalid parents, return an error
    if (invalidAddons.length > 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Parent items not found for the following addons: ${invalidAddons.join(", ")}. Make sure parent items are created before their addons.`,
      };
    }

    if (mainItems.length === 0) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Order must contain at least one main item",
      };
    }

    // Group main items by department for KOT generation
    const itemsByDepartment = mainItems.reduce((acc, item) => {
      const departmentId = item.departmentId;
      if (!acc[departmentId]) {
        acc[departmentId] = [];
      }
      acc[departmentId].push(item);
      return acc;
    }, {});

    // Generate KOT numbers for the day
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const todayKotsCount = await kotModel.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
      transaction,
    });

    let baseKotNo = todayKotsCount + 1;

    // Prepare order data
    const orderData = {
      ...req.body,
      orderStartTime: new Date(),
      status: "pending",
      paymentStatus: "pending",
      orderNumber: `ORD-${Date.now()}`,
      customerDetails: customerDetails || null,
    };

    // Add order type specific data
    if (orderType === "dineIn") {
      orderData.sessionId = sessionId;
      orderData.tableId = tableId;
    } else if (orderType === "takeaway") {
      orderData.takeAwayName = takeAwayName;
    }

    // Create the order
    const order = await orderModel.create(orderData, { transaction });

    let totalAmount = 0;
    const kotRecords = [];
    const createdItems = new Map(); // Store created items by tempId

    // Create KOTs and process main items
    for (const [departmentId, items] of Object.entries(itemsByDepartment)) {
      const kot = await kotModel.create(
        {
          orderId: order.id,
          departmentId,
          kotNumber: baseKotNo++,
          status: "pending",
        },
        { transaction },
      );

      kotRecords.push(kot);

      // Process main items
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

        // Fetch price from DB to prevent manipulation, and apply discounts if provided
        const unitPrice = product.price;
        const quantity = item.quantity;
        let subtotal = unitPrice * quantity;
        const discountAmount = item.discount || 0;
        const discountPercentage = item.discountPercentage || 0;
        subtotal -= discountAmount;
        subtotal *= 1 - discountPercentage / 100;

        // Create the main order item
        const orderItemData = {
          orderId: order.id,
          kotId: kot.id,
          productId: item.productId,
          openItemId: item.openItemId,
          quantity,
          specialInstructions: item.specialInstructions || "",
          departmentId: item.departmentId,
          isAddon: false,
          price: unitPrice,
          subtotal,
          status: "pending",
        };

        const createdItem = await orderItemModel.create(orderItemData, {
          transaction,
        });
        if (item.tempId) {
          createdItems.set(item.tempId, createdItem);
        }
        totalAmount += subtotal;

        // Process addons for this main item
        const itemAddons = processedAddonItems.filter(
          (addon) => addon.parentTempId === item.tempId,
        );
        for (const addon of itemAddons) {
          const addonProduct = await addonModel.findByPk(addon.addonId, {
            transaction,
          });
          if (!addonProduct) {
            await transaction.rollback();
            return {
              status: 404,
              success: false,
              message: `Addon with ID ${addon.addonId} not found`,
            };
          }

          const addonSubtotal = addonProduct.price * (addon.quantity || 1);
          const addonOrderItem = await orderItemModel.create(
            {
              orderId: order.id,
              kotId: kot.id,
              addonId: addon.addonId,
              parentOrderItemId: createdItem.id,
              quantity: addon.quantity || 1,
              specialInstructions: addon.specialInstructions,
              departmentId: addon.departmentId,
              isAddon: true,
              price: addonProduct.price,
              subtotal: addonSubtotal,
              status: "pending",
            },
            { transaction },
          );

          totalAmount += addonSubtotal;
        }
      }
    }

    // Update order with final total amount and payable amount
    await order.update(
      { totalAmount, payableAmount: totalAmount },
      { transaction },
    );

    // Commit the transaction
    await transaction.commit();

    // Return the created order with all its items
    const createdOrder = await orderModel.findByPk(order.id, {
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
            {
              model: addonModel,
              as: "addon",
            },
            {
              model: orderItemModel,
              as: "addons",
              include: [
                {
                  model: addonModel,
                  as: "addon",
                },
              ],
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

    return {
      status: 201,
      success: true,
      message: "Order created successfully",
      data: createdOrder,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Create order error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to create order",
      error: error.message,
    };
  }
};

const updateOrderItems = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { orderItems = [] } = req.body;

    // Fetch order with items and addons
    const order = await orderModel.findByPk(orderId, {
      include: [
        {
          model: orderItemModel,
          as: "orderItems",
          include: [
            {
              model: orderItemModel,
              as: "addons",
            },
          ],
        },
      ],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return { status: 404, success: false, message: "Order not found" };
    }

    // Separate new and existing items
    const newItems = orderItems.filter((i) => !i.id);
    const oldItems = orderItems.filter((i) => i.id);

    // Process updates to existing items
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

      // Prevent updates to cancelled or preparing items
      if (existing.status === "cancelled") {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: `Cannot update cancelled item ${existing.id}`,
        };
      }
      if (
        incoming.quantity !== undefined &&
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

      // Update quantity, specialInstructions, and discount
      if (
        incoming.quantity !== undefined ||
        incoming.specialInstructions !== undefined ||
        incoming.discount !== undefined ||
        incoming.discountPercentage !== undefined
      ) {
        const discountAmount = incoming.discount || existing.discount || 0;
        const discountPercentage = incoming.discountPercentage || 0;
        const price = existing.price;
        const quantity =
          incoming.quantity !== undefined
            ? incoming.quantity
            : existing.quantity;
        const percentageDiscount =
          price * quantity * (discountPercentage / 100);
        const flatDiscount = discountAmount + percentageDiscount;
        const subtotal = price * quantity - flatDiscount;

        await existing.update(
          {
            quantity,
            specialInstructions:
              incoming.specialInstructions !== undefined
                ? incoming.specialInstructions
                : existing.specialInstructions,
            discount: flatDiscount,
            subtotal,
          },
          { transaction },
        );
      }

      // Handle addons for existing item
      if (incoming.addons && Array.isArray(incoming.addons)) {
        const existingAddons = existing.addons || [];
        const incomingAddonIds = incoming.addons
          .map((a) => a.addonId)
          .filter(Boolean);

        // Delete addons not in incoming list (if not cancelled)
        await orderItemModel.destroy({
          where: {
            parentOrderItemId: existing.id,
            addonId: { [Op.notIn]: incomingAddonIds },
            status: { [Op.ne]: "cancelled" },
          },
          transaction,
        });

        // Process incoming addons
        for (const addon of incoming.addons) {
          if (!addon.addonId) continue;
          const addonProduct = await addonModel.findByPk(addon.addonId, {
            transaction,
          });
          if (!addonProduct) {
            await transaction.rollback();
            return {
              status: 404,
              success: false,
              message: `Addon with ID ${addon.addonId} not found`,
            };
          }

          const existingAddon = existingAddons.find(
            (ea) => ea.addonId === addon.addonId,
          );
          if (existingAddon) {
            // Update existing addon
            if (
              addon.quantity !== undefined ||
              addon.specialInstructions !== undefined
            ) {
              const addonSubtotal =
                addonProduct.price *
                (addon.quantity !== undefined
                  ? addon.quantity
                  : existingAddon.quantity);
              await existingAddon.update(
                {
                  quantity:
                    addon.quantity !== undefined
                      ? addon.quantity
                      : existingAddon.quantity,
                  specialInstructions:
                    addon.specialInstructions !== undefined
                      ? addon.specialInstructions
                      : existingAddon.specialInstructions,
                  subtotal: addonSubtotal,
                },
                { transaction },
              );
            }
          } else {
            // Create new addon
            const addonSubtotal = addonProduct.price * (addon.quantity || 1);
            await orderItemModel.create(
              {
                orderId,
                kotId: existing.kotId, // Inherit from parent
                addonId: addon.addonId,
                parentOrderItemId: existing.id,
                quantity: addon.quantity || 1,
                specialInstructions: addon.specialInstructions || "",
                departmentId: existing.departmentId,
                isAddon: true,
                price: addonProduct.price,
                discount: 0, // No discounts for addons
                subtotal: addonSubtotal,
                status: "pending",
              },
              { transaction },
            );
          }
        }
      }
    }

    // Process new items (with addons)
    if (newItems.length > 0) {
      const createdItems = new Map(); // Track tempId to created item

      // Generate KOT numbers for new items if needed
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
      );
      const todayKotsCount = await kotModel.count({
        where: {
          createdAt: { [Op.between]: [startOfToday, endOfToday] },
        },
        transaction,
      });
      let baseKotNo = todayKotsCount + 1;

      // Group new items by department for KOT assignment
      const itemsByDepartment = newItems.reduce((acc, item) => {
        const departmentId = item.departmentId;
        if (!acc[departmentId]) acc[departmentId] = [];
        acc[departmentId].push(item);
        return acc;
      }, {});

      // Create KOTs and main items
      for (const [departmentId, items] of Object.entries(itemsByDepartment)) {
        // Find or create KOT for this department
        let kot = await kotModel.findOne({
          where: { orderId, departmentId, status: { [Op.ne]: "cancelled" } },
          transaction,
        });
        if (!kot) {
          kot = await kotModel.create(
            {
              orderId,
              departmentId,
              kotNumber: baseKotNo++,
              status: "pending",
            },
            { transaction },
          );
        }

        // Create main items
        for (const item of items) {
          item.tempId = item.tempId || `temp_${uuidv4()}`; // Generate if not provided
          const isProduct = !!item.productId;
          const itemModel = isProduct ? productModel : openItemModel;
          const itemId = isProduct ? item.productId : item.openItemId;

          const product = await itemModel.findByPk(itemId, { transaction });
          if (!product) {
            await transaction.rollback();
            return {
              status: 404,
              success: false,
              message: `Item with ID ${itemId} not found`,
            };
          }

          // Verify departmentId
          if (product.departmentId !== item.departmentId) {
            await transaction.rollback();
            return {
              status: 400,
              success: false,
              message: `Department ID mismatch for item ${itemId}`,
            };
          }

          // Compute discount and subtotal
          const discountAmount = item.discount || 0;
          const discountPercentage = item.discountPercentage || 0;
          const percentageDiscount =
            product.price * item.quantity * (discountPercentage / 100);
          const flatDiscount = discountAmount + percentageDiscount;
          const subtotal = product.price * item.quantity - flatDiscount;

          // Create main item
          const createdItem = await orderItemModel.create(
            {
              orderId,
              productId: item.productId,
              openItemId: item.openItemId,
              quantity: item.quantity,
              specialInstructions: item.specialInstructions || "",
              departmentId: item.departmentId,
              isAddon: false,
              price: product.price,
              discount: flatDiscount,
              subtotal,
              status: "pending",
              kotId: kot.id,
            },
            { transaction },
          );
          createdItems.set(item.tempId, createdItem);
        }
      }

      // Create addons for new items
      for (const item of newItems) {
        if (item.addons && Array.isArray(item.addons)) {
          const parentItem = createdItems.get(item.tempId);
          if (!parentItem) {
            await transaction.rollback();
            return {
              status: 400,
              success: false,
              message: `Parent item for addons not found for tempId ${item.tempId}`,
            };
          }

          for (const addon of item.addons) {
            if (!addon.addonId) continue;
            const addonProduct = await addonModel.findByPk(addon.addonId, {
              transaction,
            });
            if (!addonProduct) {
              await transaction.rollback();
              return {
                status: 404,
                success: false,
                message: `Addon with ID ${addon.addonId} not found`,
              };
            }

            const addonSubtotal = addonProduct.price * (addon.quantity || 1);
            await orderItemModel.create(
              {
                orderId,
                kotId: parentItem.kotId,
                addonId: addon.addonId,
                parentOrderItemId: parentItem.id,
                quantity: addon.quantity || 1,
                specialInstructions: addon.specialInstructions || "",
                departmentId: parentItem.departmentId,
                isAddon: true,
                price: addonProduct.price,
                discount: 0,
                subtotal: addonSubtotal,
                status: "pending",
              },
              { transaction },
            );
          }
        }
      }
    }

    // Recalculate order totalAmount and payableAmount
    const validItems = await orderItemModel.findAll({
      where: {
        orderId,
        isAddon: false,
      },
      include: [
        {
          model: orderItemModel,
          as: "addons",
          required: false,
        },
      ],
      transaction,
    });

    // Calculate totalAmount (all non-cancelled items, including addons)
    const totalAmount = validItems.reduce((sum, item) => {
      if (item.status === "cancelled") return sum;
      const itemTotal =
        Number(item.subtotal) ||
        Number(item.price) * Number(item.quantity) - Number(item.discount || 0);
      const addonTotal = (item.addons || []).reduce((asum, addon) => {
        if (addon.status === "cancelled") return asum;
        return (
          asum +
          (Number(addon.subtotal) ||
            Number(addon.price) * Number(addon.quantity) -
              Number(addon.discount || 0))
        );
      }, 0);
      return sum + itemTotal + addonTotal;
    }, 0);

    // Calculate payableAmount (non-cancelled, non-completed items, including addons)
    const payableAmount = validItems.reduce((sum, item) => {
      if (item.status === "cancelled" || item.status === "completed")
        return sum;
      const itemTotal =
        Number(item.subtotal) ||
        Number(item.price) * Number(item.quantity) - Number(item.discount || 0);
      const addonTotal = (item.addons || []).reduce((asum, addon) => {
        if (addon.status === "cancelled" || addon.status === "completed")
          return asum;
        return (
          asum +
          (Number(addon.subtotal) ||
            Number(addon.price) * Number(addon.quantity) -
              Number(addon.discount || 0))
        );
      }, 0);
      return sum + itemTotal + addonTotal;
    }, 0);

    // Update order with totalAmount and payableAmount
    await order.update({ totalAmount, payableAmount }, { transaction });

    // Refetch order for response
    const updatedOrder = await orderModel.findByPk(orderId, {
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
            {
              model: openItemModel,
              as: "openItem",
            },
            {
              model: addonModel,
              as: "addon",
            },
            {
              model: orderItemModel,
              as: "addons",
              include: [{ model: addonModel, as: "addon" }],
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
      transaction,
    });

    await transaction.commit();

    return {
      status: 200,
      success: true,
      message: "Order items updated successfully",
      data: updatedOrder,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Update order items error:", error);
    return {
      status: 500,
      success: false,
      message: "Failed to update order items",
      error: error.message,
    };
  }
};

const getTableActiveOrders = async (req) => {
  const { id: tableId } = req.params;

  try {
    // Find the table with the given ID
    const table = await tableModel.findByPk(tableId);

    if (!table) {
      return {
        status: 404,
        success: false,
        message: "Table not found",
      };
    }

    // Check if table has an active session
    if (!table.sessionId) {
      return {
        status: 200,
        success: true,
        message: "No active session for this table",
        data: {
          table: {
            id: table.id,
            tableNo: table.tableNo,
            status: table.status,
            sessionId: null,
            sessionStartTime: null,
          },
          orders: [],
          sessionTotal: 0,
        },
      };
    }

    // Find all active orders for this table's session
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
          where: {
            status: { [Op.notIn]: ["completed", "cancelled"] },
            isAddon: false, // Only get main items
          },
          required: false, // LEFT JOIN to include orders even without items
          include: [
            {
              model: productModel,
              as: "product",
              include: [
                {
                  model: productMediaModel,
                  as: "mediaArr",
                },
              ],
              required: false,
            },
            // Include addons for each order item
            {
              model: orderItemModel,
              as: "addons",
              where: {
                status: { [Op.notIn]: ["completed", "cancelled"] },
              },
              required: false, // LEFT JOIN to include items even without addons
              include: [
                {
                  model: addonModel,
                  as: "addon",
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Transform the orders to include calculated totals
    let sessionTotal = 0;
    const transformedOrders = orders.map((order) => {
      const plainOrder = order.get({ plain: true });
      let orderTotal = 0;

      if (plainOrder.orderItems && plainOrder.orderItems.length > 0) {
        plainOrder.orderItems = plainOrder.orderItems.map((item) => {
          // Calculate addons total for this item
          const addonsTotal = (item.addons || []).reduce((sum, addon) => {
            return sum + (parseFloat(addon.subtotal) || 0);
          }, 0);

          // Calculate item total (item subtotal + addons total)
          const itemTotal = (parseFloat(item.subtotal) || 0) + addonsTotal;

          // Update order total
          orderTotal += itemTotal;

          return {
            ...item,
            addonsTotal,
            itemTotal,
            originalSubtotal: item.subtotal,
          };
        });

        // Update session total
        sessionTotal += orderTotal;
      }

      return {
        ...plainOrder,
        calculatedTotal: orderTotal,
      };
    });

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
        orders: transformedOrders,
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
      accountId,
      orderItemIds,
      payments,
      ...updateData
    } = req.body;

    // For dine-in flow, tableId is used; for takeaway, tableId may be missing/ignored
    const hasTable =
      !!tableId &&
      tableId !== "0" &&
      tableId !== "null" &&
      tableId !== "undefined";

    // Validate paymentMethod if provided (for single payment)
    const validPaymentMethods = ["cash", "card", "online", "cheque"];
    if (
      updateData.paymentMethod &&
      !validPaymentMethods.includes(updateData.paymentMethod)
    ) {
      await transaction.rollback();
      return { status: 400, success: false, message: "Invalid payment method" };
    }

    // Helper function to calculate order amounts
    const calculateOrderAmounts = async (orderId, transaction) => {
      const mainItems = await orderItemModel.findAll({
        where: {
          orderId,
          isAddon: false,
          status: { [Op.ne]: "cancelled" },
        },
        include: [
          {
            model: orderItemModel,
            as: "addons",
            where: { status: { [Op.ne]: "cancelled" } },
            required: false,
          },
        ],
        transaction,
      });

      const totalAmount = mainItems.reduce((sum, item) => {
        const itemTotal =
          Number(item.subtotal) ||
          Number(item.price) * Number(item.quantity) -
            Number(item.discount || 0);
        const addonTotal = item.addons.reduce(
          (asum, addon) =>
            asum +
            (Number(addon.subtotal) ||
              Number(addon.price) * Number(addon.quantity) -
                Number(addon.discount || 0)),
          0,
        );
        return sum + itemTotal + addonTotal;
      }, 0);

      const remainingMainItems = mainItems.filter(
        (item) => item.status !== "completed",
      );
      const payableAmount = remainingMainItems.reduce((sum, item) => {
        const itemTotal =
          Number(item.subtotal) ||
          Number(item.price) * Number(item.quantity) -
            Number(item.discount || 0);
        const addonTotal = item.addons
          .filter((a) => a.status !== "completed")
          .reduce(
            (asum, addon) =>
              asum +
              (Number(addon.subtotal) ||
                Number(addon.price) * Number(addon.quantity) -
                  Number(addon.discount || 0)),
            0,
          );
        return sum + itemTotal + addonTotal;
      }, 0);

      return { totalAmount, payableAmount };
    };

    // If selective checkout by order items is requested, handle that path
    if (Array.isArray(orderItemIds) && orderItemIds.length > 0) {
      // Fetch target items and their addons for active orders on this table
      const targetItems = await orderItemModel.findAll({
        where: {
          id: { [Op.in]: orderItemIds },
          isAddon: false, // Only main items in orderItemIds
        },
        include: [
          {
            model: orderModel,
            as: "order",
            where: {
              tableId,
              status: { [Op.notIn]: ["completed", "cancelled"] },
            },
          },
          {
            model: orderItemModel,
            as: "addons",
            where: { status: { [Op.ne]: "cancelled" } },
            required: false,
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

      // Group items by order and collect addon IDs
      const itemsByOrder = targetItems.reduce((acc, item) => {
        const oid = item.orderId;
        if (!acc[oid]) acc[oid] = { mainItems: [], addons: [] };
        acc[oid].mainItems.push(item);
        if (item.addons) acc[oid].addons.push(...item.addons);
        return acc;
      }, {});

      // Determine account to credit
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

      // Prepare payments
      let paymentList = [];
      if (Array.isArray(payments) && payments.length > 0) {
        const totalPaid = payments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0,
        );
        const subsetTotal = Object.values(itemsByOrder).reduce(
          (sum, { mainItems, addons }) => {
            return (
              sum +
              [...mainItems, ...addons].reduce((s, it) => {
                const line =
                  Number(it.subtotal) ||
                  Number(it.price) * Number(it.quantity) -
                    Number(it.discount || 0);
                return s + (isNaN(line) ? 0 : line);
              }, 0)
            );
          },
          0,
        );
        if (totalPaid !== subsetTotal) {
          await transaction.rollback();
          return {
            status: 400,
            success: false,
            message:
              "Payments must cover exactly the selected items' total amount",
          };
        }
        for (const p of payments) {
          if (!validPaymentMethods.includes(p.paymentMethod)) {
            await transaction.rollback();
            return {
              status: 400,
              success: false,
              message: "Invalid payment method in split",
            };
          }
        }
        paymentList = payments;
      } else {
        const subsetTotal = Object.values(itemsByOrder).reduce(
          (sum, { mainItems, addons }) => {
            return (
              sum +
              [...mainItems, ...addons].reduce((s, it) => {
                const line =
                  Number(it.subtotal) ||
                  Number(it.price) * Number(it.quantity) -
                    Number(it.discount || 0);
                return s + (isNaN(line) ? 0 : line);
              }, 0)
            );
          },
          0,
        );
        paymentList = [
          {
            paymentMethod: updateData.paymentMethod || "cash",
            amount: subsetTotal,
            cashOrCredit: updateData.cashOrCredit || "cash",
            remarks: updateData.remarks,
            accountId: selectedAccountId,
          },
        ];
      }

      const updatedOrders = [];
      const revenueEntries = [];
      let combinedPaidAmount = paymentList.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );

      // Process each order
      for (const [oid, { mainItems, addons }] of Object.entries(itemsByOrder)) {
        // Compute subset total including addons
        const subsetTotal = [...mainItems, ...addons].reduce((sum, it) => {
          const line =
            Number(it.subtotal) ||
            Number(it.price) * Number(it.quantity) - Number(it.discount || 0);
          return sum + (isNaN(line) ? 0 : line);
        }, 0);

        // Recalculate original amounts before marking
        const { totalAmount: originalTotal, payableAmount: originalPayable } =
          await calculateOrderAmounts(oid, transaction);

        // Mark main items and their addons as completed
        const allItemIds = [
          ...mainItems.map((it) => it.id),
          ...addons.map((it) => it.id),
        ];
        await orderItemModel.update(
          { status: "completed" },
          {
            where: {
              id: { [Op.in]: allItemIds },
              status: { [Op.notIn]: ["completed", "cancelled"] },
            },
            validate: false,
            transaction,
          },
        );

        // Update KOTs that are now fully completed/cancelled
        const touchedKotIds = Array.from(
          new Set(
            [...mainItems, ...addons].map((it) => it.kotId).filter(Boolean),
          ),
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

        // Recalculate order amounts after marking
        const { totalAmount, payableAmount: calculatedNewPayable } =
          await calculateOrderAmounts(oid, transaction);

        // Distribute payment across the order
        const amountPaidForOrder = subsetTotal;
        const newPayableAmount = originalPayable - amountPaidForOrder;

        if (newPayableAmount !== calculatedNewPayable) {
          await transaction.rollback();
          return {
            status: 500,
            success: false,
            message: `Inconsistent payable amount calculation for order ${oid}`,
          };
        }

        // Update order
        const updateFields = {
          totalAmount,
          payableAmount: newPayableAmount,
        };
        if (newPayableAmount <= 0) {
          updateFields.status = "completed";
          updateFields.paymentStatus = "paid";
          updateFields.orderFinishTime = new Date();
        } else {
          updateFields.paymentStatus = "partially_paid";
        }
        const orderRecord = await orderModel.findByPk(oid, { transaction });
        await orderRecord.update(updateFields, { transaction });

        // Create revenue entries for this subset
        let remainingAmount = amountPaidForOrder;
        for (const payment of paymentList) {
          if (remainingAmount <= 0) break;
          const paymentAmount = Math.min(
            Number(payment.amount),
            remainingAmount,
          );
          if (paymentAmount > 0) {
            const revenue = await revenueModel.create(
              {
                amount: paymentAmount,
                paymentMethod: payment.paymentMethod,
                cash_or_credit: payment.cashOrCredit || "cash",
                customerId: customerId || null,
                userId: req.user.id,
                accountId: payment.accountId || selectedAccountId,
                remarks:
                  payment.remarks ||
                  `Revenue from partial checkout of order ${oid}`,
                orderId: oid,
              },
              { transaction },
            );
            revenueEntries.push(revenue);
            remainingAmount -= paymentAmount;
            payment.amount = Number(payment.amount) - paymentAmount;
          }
        }

        updatedOrders.push(orderRecord);
      }

      // Free table if no active orders remain
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
          combinedPaidAmount,
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
        include: [
          {
            model: orderItemModel,
            as: "orderItems",
            include: [
              {
                model: orderItemModel,
                as: "addons",
                where: { status: { [Op.ne]: "cancelled" } },
                required: false,
              },
            ],
          },
        ],
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
          include: [
            {
              model: orderItemModel,
              as: "orderItems",
              include: [
                {
                  model: orderItemModel,
                  as: "addons",
                  where: { status: { [Op.ne]: "cancelled" } },
                  required: false,
                },
              ],
            },
          ],
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
          include: [
            {
              model: orderItemModel,
              as: "orderItems",
              include: [
                {
                  model: orderItemModel,
                  as: "addons",
                  where: { status: { [Op.ne]: "cancelled" } },
                  required: false,
                },
              ],
            },
          ],
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

    // Recalculate totalAmount and payableAmount for each order
    for (const order of orders) {
      const { totalAmount, payableAmount } = await calculateOrderAmounts(
        order.id,
        transaction,
      );

      if (
        isNaN(totalAmount) ||
        totalAmount < 0 ||
        isNaN(payableAmount) ||
        payableAmount < 0
      ) {
        await transaction.rollback();
        return {
          status: 500,
          success: false,
          message: `Invalid amounts for order ${order.id}`,
        };
      }

      await order.update({ totalAmount, payableAmount }, { transaction });
    }

    // Calculate combined payable amount
    const combinedPayableAmount = orders.reduce(
      (sum, order) => sum + Number(order.payableAmount),
      0,
    );

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

    // Prepare payments
    let paymentList = [];
    let usedMethods = [];
    if (checkoutAll && Array.isArray(payments) && payments.length > 0) {
      // Split payment
      const totalPaid = payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );
      if (totalPaid > combinedPayableAmount) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message:
            "Total payment amount cannot exceed the remaining payable amount",
        };
      }
      for (const p of payments) {
        if (!validPaymentMethods.includes(p.paymentMethod)) {
          await transaction.rollback();
          return {
            status: 400,
            success: false,
            message: "Invalid payment method in split",
          };
        }
      }
      paymentList = payments;
      usedMethods = [...new Set(payments.map((p) => p.paymentMethod))];
    } else {
      // Single payment
      paymentList = [
        {
          paymentMethod: updateData.paymentMethod || "cash",
          amount: combinedPayableAmount,
          cashOrCredit: updateData.cashOrCredit || "cash",
          remarks: updateData.remarks,
          accountId: accountId,
        },
      ];
      usedMethods = [paymentList[0].paymentMethod];
    }

    // Distribute payments across orders
    let remainingTotalPaid = paymentList.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const updatedOrders = [];
    const revenueEntries = [];

    for (const order of orders) {
      const amountPaidForOrder = Math.min(
        Number(order.payableAmount),
        remainingTotalPaid,
      );
      const newPayableAmount = Number(order.payableAmount) - amountPaidForOrder;

      // Create revenue entries for this order
      let orderRemainingAmount = amountPaidForOrder;
      for (const payment of paymentList) {
        if (orderRemainingAmount <= 0) break;
        const paymentAmount = Math.min(
          Number(payment.amount),
          orderRemainingAmount,
        );
        if (paymentAmount <= 0) continue;

        let selectedAccountId = payment.accountId;
        if (!selectedAccountId) {
          let account = await accountModel.findOne({
            where: { isDefault: true, status: "active" },
            transaction,
          });
          if (!account) {
            const accountTypeMap = {
              cash: "cash",
              card: "bank",
              cheque: "bank",
              online: "wallet",
            };
            const accountType = accountTypeMap[payment.paymentMethod] || "cash";
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

        const revenue = await revenueModel.create(
          {
            amount: paymentAmount,
            paymentMethod: payment.paymentMethod,
            cash_or_credit: payment.cashOrCredit || "cash",
            customerId: finalCustomerId,
            userId: req.user.id,
            accountId: selectedAccountId,
            remarks:
              payment.remarks || `Revenue from checkout of order ${order.id}`,
            orderId: order.id,
          },
          { transaction },
        );
        revenueEntries.push(revenue);
        orderRemainingAmount -= paymentAmount;
        payment.amount = Number(payment.amount) - paymentAmount;
      }

      // Update order
      const updateFields = {
        ...updateData,
        paymentMethods: usedMethods,
        paymentStatus: newPayableAmount <= 0 ? "paid" : "partially_paid",
        status: newPayableAmount <= 0 ? "completed" : order.status,
        customerId: finalCustomerId,
        isGuestOrder,
        payableAmount: newPayableAmount,
        ...(newPayableAmount <= 0 && { orderFinishTime: new Date() }),
      };
      if (newPayableAmount <= 0) {
        updateFields.status = "completed";
        updateFields.paymentStatus = "paid";
        updateFields.orderFinishTime = new Date();
      } else {
        updateFields.paymentStatus = "partially_paid";
      }
      await order.update(updateFields, { transaction });

      // Mark items and KOTs as completed if fully paid
      if (newPayableAmount <= 0) {
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

        const kots = await kotModel.findAll({
          where: { orderId: order.id },
          attributes: ["id"],
          transaction,
        });
        const kotIds = kots.map((k) => k.id);
        if (kotIds.length > 0) {
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
          const completeKotIds = kotIds.filter(
            (id) => !incompleteKotIds.has(id),
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
      }

      updatedOrders.push({ ...order.toJSON() });
      remainingTotalPaid -= amountPaidForOrder;
    }

    // Calculate and update loyalty points
    let loyaltyPointsAdded = 0;
    if (!isGuestOrder && finalCustomerId && remainingTotalPaid >= 0) {
      loyaltyPointsAdded = Math.floor(combinedPayableAmount / 100);
      if (loyaltyPointsAdded > 0) {
        await customerModel.update(
          {
            loyaltyPoints: Sequelize.literal(
              `loyaltyPoints + ${loyaltyPointsAdded}`,
            ),
          },
          {
            where: { id: finalCustomerId },
            transaction,
          },
        );
      }
    }

    // Check for other active orders and free table if necessary
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
      message: `Checked out ${updatedOrders.length} order(s) successfully`,
      data: {
        orders: updatedOrders,
        revenueEntries,
        combinedPayableAmount,
        loyaltyPointsAdded,
      },
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in checkoutOrder:", error.message);
    return {
      status: 500,
      success: false,
      message: error.message || "Internal server error",
    };
  }
};

const getOrderById = async (req) => {
  const { id } = req.params;
  const { itemStatus } = req.query;

  try {
    // Build the include options based on itemStatus
    const include = [
      {
        model: orderItemModel,
        as: "orderItems",
        where: {
          isAddon: false, // Only get main items
          ...(itemStatus && {
            status: itemStatus.includes(",")
              ? { [Op.in]: itemStatus.split(",").map((s) => s.trim()) }
              : itemStatus === "active"
                ? { [Op.notIn]: ["completed", "cancelled"] }
                : { [Op.eq]: itemStatus },
          }),
        },
        required: false,
        include: [
          {
            model: productModel,
            as: "product",
            include: [{ model: productMediaModel, as: "mediaArr" }],
          },
          {
            model: orderItemModel,
            as: "addons",
            where: {
              isAddon: true,
              ...(itemStatus && {
                status: itemStatus.includes(",")
                  ? { [Op.in]: itemStatus.split(",").map((s) => s.trim()) }
                  : itemStatus === "active"
                    ? { [Op.notIn]: ["completed", "cancelled"] }
                    : { [Op.eq]: itemStatus },
              }),
            },
            required: false,
            include: [
              {
                model: addonModel,
                as: "addon",
                required: false,
              },
            ],
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
    ];

    // Find the order with the given ID
    const order = await orderModel.findByPk(id, { include });

    if (!order) {
      return {
        status: 404,
        success: false,
        message: "Order not found",
      };
    }

    // Transform the order to include calculated totals
    const plainOrder = order.get({ plain: true });
    let orderTotal = 0;

    if (plainOrder.orderItems && plainOrder.orderItems.length > 0) {
      plainOrder.orderItems = plainOrder.orderItems.map((item) => {
        // Calculate addons total for this item (excluding cancelled addons)
        const addonsTotal = (item.addons || []).reduce((sum, addon) => {
          return addon.status === "cancelled"
            ? sum
            : sum + (parseFloat(addon.subtotal) || 0);
        }, 0);

        // Calculate item total (0 if item is cancelled, otherwise subtotal + addons)
        const itemTotal =
          item.status === "cancelled"
            ? 0
            : (parseFloat(item.subtotal) || 0) + addonsTotal;

        // Update order total (only include non-cancelled items)
        if (item.status !== "cancelled") {
          orderTotal += itemTotal;
        }

        return {
          ...item,
          addonsTotal,
          itemTotal,
          originalSubtotal: item.subtotal,
        };
      });

      // Add the calculated total to the order
      plainOrder.calculatedTotal = orderTotal;
    }

    return {
      status: 200,
      success: true,
      message: "Order retrieved successfully",
      data: plainOrder,
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
        where: { status: { [Op.ne]: "cancelled" } },
        required: false, // Allow orders with no active items
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
            model: addonModel,
            as: "addon",
          },
          {
            model: orderItemModel,
            as: "addons",
            where: { status: { [Op.ne]: "cancelled" } },
            required: false,
            include: [
              {
                model: addonModel,
                as: "addon",
              },
            ],
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
  const { orderItemIds, status } = req.body;

  if (!orderItemIds || !Number.isInteger(orderItemIds)) {
    return {
      status: 400,
      success: false,
      message: "A single valid order item ID must be provided",
    };
  }

  const transaction = await sequelize.transaction();

  try {
    // Fetch the order item with includes
    const orderItem = await orderItemModel.findOne({
      where: { id: orderItemIds },
      include: [
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
      ],
      transaction,
    });

    if (!orderItem) {
      await transaction.rollback();
      return {
        status: 404,
        success: false,
        message: "Order item not found",
      };
    }

    // Validate status transition
    if (
      (status === "preparing" && orderItem.status !== "pending") ||
      (status === "ready" && orderItem.status !== "preparing")
    ) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message:
          "Some order items could not be updated due to invalid transitions",
      };
    }

    // Update the order item
    await orderItemModel.update(
      { status },
      {
        where: { id: orderItemIds },
        validate: false,
        transaction,
      },
    );

    // If cancelled, handle addons and KOT
    if (status === "cancelled") {
      // Find all KOTs that include this order item
      const kots = await kotModel.findAll({
        include: [
          {
            model: orderItemModel,
            as: "orderItems",
            where: { id: orderItem.id },
            attributes: [], // We don't need the order item data
            required: true,
          },
        ],
        transaction,
      });

      // Handle KOT
      if (orderItem.kotId) {
        const kotItems = await orderItemModel.findAll({
          where: { kotId: orderItem.kotId },
          transaction,
        });

        // Check if all items in this KOT are cancelled
        const allItemsCancelled = kotItems.every(
          (item) => item.status === "cancelled" || item.id === orderItem.id,
        );

        // Only update KOT status if all its items are cancelled
        if (allItemsCancelled && kot.status !== "cancelled") {
          await kotModel.update(
            { status: "cancelled" },
            {
              where: { id: orderItem.kotId },
              transaction,
              validate: false,
            },
          );
        }
      }
    }

    // If cancelled or completed, update order and table
    if (["cancelled", "completed"].includes(status)) {
      const orderId = orderItem.orderId;

      // Recalculate totalAmount and payableAmount
      const mainItems = await orderItemModel.findAll({
        where: {
          orderId: orderItem.orderId,
          status: { [Op.notIn]: ["completed", "cancelled"] },
          id: { [Op.ne]: orderItem.id }, // Exclude the current item being updated
        },
        transaction,
      });

      // If no active items remain, update the order status
      if (activeItemsCount === 0) {
        const newOrderStatus =
          status === "cancelled" ? "cancelled" : "completed";

        await orderModel.update(
          { status: newOrderStatus },
          {
            where: { id: orderItem.orderId },
            transaction,
          },
        );

        // If it's a dine-in order with a table, and we're marking the order as completed/cancelled
        if (
          (status === "cancelled" || status === "completed") &&
          orderItem.order?.orderType === "dineIn" &&
          orderItem.order?.tableId
        ) {
          try {
            // Get the current order to verify its status
            const currentOrder = await orderModel.findByPk(orderItem.orderId, {
              transaction,
            });

            // Only proceed if the order is actually being marked as completed/cancelled
            if (
              currentOrder &&
              (currentOrder.status === "completed" ||
                currentOrder.status === "cancelled")
            ) {
              // Count active orders for this table, excluding the current order
              const activeOrdersCount = await orderModel.count({
                where: {
                  tableId: orderItem.order.tableId,
                  status: { [Op.notIn]: ["completed", "cancelled"] },
                  id: { [Op.ne]: orderItem.orderId },
                },
                transaction,
              });

              // If no active orders remain, update the table status
              if (activeOrdersCount === 0) {
                await tableModel.update(
                  {
                    status: "available",
                    currentSessionId: null, // Clear any session data
                    sessionStartTime: null,
                  },
                  {
                    where: {
                      id: orderItem.order.tableId,
                      status: { [Op.ne]: "available" }, // Only update if not already available
                    },
                    transaction,
                  },
                );
              }
            }
          } catch (error) {
            console.error("Error updating table status:", error);
            // Don't fail the entire operation if table status update fails
            // The main order item update is more important
          }
        }
      }
    }

    await transaction.commit();
    return {
      status: 200,
      success: true,
      message: `Order item updated to ${status} successfully`,
      data: [orderItem],
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating order item status:", error);
    return {
      status: 500,
      success: false,
      message: "Error updating order item status",
      error: error.message,
    };
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

/**
 * Settle an order after NEPALPAY QR confirmation (async gateway flow).
 */
const finalizeQrPayment = async (
  {
    orderId,
    amount,
    accountId,
    userId,
    paymentIntentId,
    gatewayReference,
    remarks,
  },
  transaction,
) => {
  const order = await orderModel.findByPk(orderId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!order) {
    return { success: false, message: "Order not found" };
  }

  let selectedAccountId = accountId;
  if (!selectedAccountId) {
    let account = await accountModel.findOne({
      where: { accountType: "wallet", status: "active", isDefault: true },
      transaction,
    });
    if (!account) {
      account = await accountModel.findOne({
        where: { accountType: "wallet", status: "active" },
        transaction,
      });
    }
    if (!account) {
      return {
        success: false,
        message: "No active wallet account configured for QR settlement",
      };
    }
    selectedAccountId = account.id;
  } else {
    const account = await accountModel.findByPk(selectedAccountId, {
      transaction,
    });
    if (!account || account.status !== "active") {
      return { success: false, message: "Invalid or inactive settlement account" };
    }
  }

  await revenueModel.create(
    {
      amount,
      paymentMethod: "online",
      cash_or_credit: "cash",
      customerId: order.customerId,
      userId,
      accountId: selectedAccountId,
      remarks: remarks || `NEPALPAY QR settlement for order ${orderId}`,
      orderId: order.id,
      paymentIntentId,
      gatewayReference,
    },
    { transaction },
  );

  const currentPayable = Number(order.payableAmount ?? order.totalAmount);
  const newPayable = Math.max(0, currentPayable - Number(amount));
  const paymentMethods = Array.isArray(order.paymentMethods)
    ? [...order.paymentMethods]
    : [];
  if (!paymentMethods.includes("nepalpay_qr")) {
    paymentMethods.push("nepalpay_qr");
  }

  const updateFields = {
    payableAmount: newPayable,
    paymentMethods,
    paymentStatus: newPayable <= 0 ? "paid" : "partially_paid",
  };

  if (newPayable <= 0) {
    updateFields.status = "completed";
    updateFields.orderFinishTime = new Date();

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

    const kots = await kotModel.findAll({
      where: { orderId: order.id },
      attributes: ["id"],
      transaction,
    });
    const kotIds = kots.map((k) => k.id);
    if (kotIds.length > 0) {
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

  await order.update(updateFields, { transaction });
  return { success: true };
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
  finalizeQrPayment,
  getOrderItems,
  updateOrderItemsStatus,
  categorySalesSummary,
  productTopSales,
  moveOrderItems,
};
