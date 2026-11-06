"use strict";

const { Op } = require("sequelize");
const {
  productModel,
  productCategoryModel,
  productMediaModel,
  productVariantModel,
  tableModel,
  orderModel,
  orderItemModel,
  openItemModel,
  addonModel,
  settingModel,
  serviceRequestModel,
} = require("../../models");
const { isGuestTokenShape } = require("../../lib/guest-token");
const { broadcastToTenant } = require("../../helpers/send-notification");
const { getTenant } = require("../../lib/tenant-context");

const CALL_BILL_COOLDOWN_MS = 60 * 1000;

function requireTenant(req) {
  if (!req.tenant?.schemaName) {
    return {
      status: 400,
      success: false,
      message:
        "Cafe domain is required. Open this page from your cafe link, for example hillside.technirvana.com.np.",
      data: null,
    };
  }
  return null;
}

function mediaUrl(mediaArr) {
  const first = Array.isArray(mediaArr) ? mediaArr[0] : null;
  return first?.imageUrl || null;
}

async function getCafeCard() {
  const setting = await settingModel.findOne({
    attributes: [
      "brand_name",
      "brandingImage",
      "fav_icon",
      "address",
      "primary_phone",
      "primaryColor",
      "wifiSsid",
      "wifiPassword",
      "guestWelcome",
      "guestHours",
      "guestInfoNote",
      "guestMenuFontSize",
    ],
  });
  const tenant = getTenant();
  const wifiSsid = setting?.wifiSsid?.trim() || null;
  const fontSize = ["md", "lg", "xl"].includes(setting?.guestMenuFontSize)
    ? setting.guestMenuFontSize
    : "md";
  return {
    name: setting?.brand_name || tenant?.name || "Menu",
    slug: tenant?.slug || null,
    logo: setting?.brandingImage || setting?.fav_icon || null,
    address: setting?.address || null,
    phone: setting?.primary_phone || null,
    primaryColor: setting?.primaryColor || null,
    welcome: setting?.guestWelcome?.trim() || null,
    hours: setting?.guestHours?.trim() || null,
    infoNote: setting?.guestInfoNote?.trim() || null,
    menuFontSize: fontSize,
    wifi: wifiSsid
      ? {
          ssid: wifiSsid,
          password: setting?.wifiPassword || "",
        }
      : null,
  };
}

async function findTableByGuestToken(token) {
  if (!isGuestTokenShape(token)) return null;
  return tableModel.findOne({
    where: { guestToken: token.trim() },
    attributes: [
      "id",
      "tableNo",
      "status",
      "sessionId",
      "sessionStartTime",
      "guestToken",
      "floorId",
      "capacity",
      "type",
    ],
  });
}

const getMenu = async (req) => {
  const tenantError = requireTenant(req);
  if (tenantError) return tenantError;

  try {
    const token = String(req.query.token || "").trim();
    let table = null;
    if (token) {
      table = await findTableByGuestToken(token);
      if (!table) {
        return {
          status: 404,
          success: false,
          message: "This table link is invalid or has been replaced.",
          data: null,
        };
      }
    }

    const categories = await productCategoryModel.findAll({
      attributes: ["id", "name", "slug", "description", "order", "imageUrl"],
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    const products = await productModel.findAll({
      attributes: [
        "id",
        "productCategoryId",
        "name",
        "description",
        "price",
        "stockStatus",
        "hasVariant",
        "isTopSelling",
        "order",
      ],
      include: [
        {
          model: productMediaModel,
          as: "mediaArr",
          attributes: ["imageUrl"],
          required: false,
        },
        {
          model: productVariantModel,
          as: "variants",
          attributes: ["id", "name", "price", "description"],
          required: false,
        },
      ],
      order: [
        ["order", "ASC"],
        ["id", "ASC"],
      ],
    });

    const byCategory = new Map();
    for (const category of categories) {
      byCategory.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || null,
        imageUrl: category.imageUrl || null,
        items: [],
      });
    }

    for (const product of products) {
      const plain = product.get({ plain: true });
      const bucket = byCategory.get(plain.productCategoryId);
      if (!bucket) continue;

      const available = plain.stockStatus !== "out_of_stock";
      bucket.items.push({
        id: plain.id,
        name: plain.name,
        description: plain.description || null,
        price: plain.hasVariant ? null : plain.price,
        imageUrl: mediaUrl(plain.mediaArr),
        available,
        isTopSelling: Boolean(plain.isTopSelling),
        variants: (plain.variants || []).map((variant) => ({
          id: variant.id,
          name: variant.name,
          price: variant.price,
          description: variant.description || null,
        })),
      });
    }

    const cafe = await getCafeCard();
    const sections = [...byCategory.values()].filter(
      (section) => section.items.length > 0,
    );

    return {
      status: 200,
      success: true,
      message: "Menu loaded",
      data: {
        cafe,
        table: table
          ? {
              id: table.id,
              tableNo: table.tableNo,
              status: table.status,
              sessionId: table.sessionId,
            }
          : null,
        sections,
      },
    };
  } catch (error) {
    console.error("guest getMenu error:", error);
    return {
      status: 500,
      success: false,
      message: "Could not load the menu right now.",
      error: error.message,
    };
  }
};

const getBill = async (req) => {
  const tenantError = requireTenant(req);
  if (tenantError) return tenantError;

  try {
    const token = String(req.query.token || req.params.token || "").trim();
    const table = await findTableByGuestToken(token);
    if (!table) {
      return {
        status: 404,
        success: false,
        message: "This table link is invalid or has been replaced.",
        data: null,
      };
    }

    const activeOrderWhere = {
      tableId: table.id,
      status: { [Op.notIn]: ["completed", "cancelled"] },
    };

    const orders = await orderModel.findAll({
      where: table.sessionId
        ? { ...activeOrderWhere, sessionId: table.sessionId }
        : activeOrderWhere,
      attributes: ["id", "orderNumber", "status", "paymentStatus", "payableAmount"],
      include: [
        {
          model: orderItemModel,
          as: "orderItems",
          where: {
            status: { [Op.notIn]: ["completed", "cancelled"] },
            isAddon: false,
          },
          required: false,
          attributes: [
            "id",
            "quantity",
            "price",
            "subtotal",
            "status",
            "specialInstructions",
          ],
          include: [
            {
              model: productModel,
              as: "product",
              attributes: ["name"],
              required: false,
            },
            {
              model: openItemModel,
              as: "openItem",
              attributes: ["name"],
              required: false,
            },
            {
              model: orderItemModel,
              as: "addons",
              where: {
                status: { [Op.notIn]: ["completed", "cancelled"] },
              },
              required: false,
              attributes: ["id", "quantity", "price", "subtotal"],
              include: [
                {
                  model: addonModel,
                  as: "addon",
                  attributes: ["name"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    let payableTotal = 0;
    const mappedOrders = orders.map((order) => {
      const plain = order.get({ plain: true });
      let orderTotal = 0;
      const items = (plain.orderItems || []).map((item) => {
        const addons = (item.addons || []).map((addon) => ({
          id: addon.id,
          name: addon.addon?.name || "Add-on",
          quantity: addon.quantity,
          price: Number(addon.price) || 0,
          subtotal: Number(addon.subtotal) || 0,
        }));
        const addonsTotal = addons.reduce((sum, a) => sum + a.subtotal, 0);
        const lineSubtotal = Number(item.subtotal) || 0;
        const itemTotal = lineSubtotal + addonsTotal;
        orderTotal += itemTotal;
        return {
          id: item.id,
          name: item.product?.name || item.openItem?.name || "Item",
          quantity: item.quantity,
          price: Number(item.price) || 0,
          subtotal: lineSubtotal,
          status: item.status,
          specialInstructions: item.specialInstructions || null,
          addons,
          itemTotal,
        };
      });
      payableTotal += orderTotal;
      return {
        id: plain.id,
        orderNumber: plain.orderNumber,
        status: plain.status,
        paymentStatus: plain.paymentStatus,
        total: orderTotal,
        items,
      };
    });

    const openBillRequest = await serviceRequestModel.findOne({
      where: {
        tableId: table.id,
        type: "bill",
        status: "open",
        ...(table.sessionId ? { sessionId: table.sessionId } : {}),
      },
      order: [["createdAt", "DESC"]],
    });

    const cafe = await getCafeCard();

    return {
      status: 200,
      success: true,
      message: "Bill loaded",
      data: {
        cafe,
        table: {
          id: table.id,
          tableNo: table.tableNo,
          status: table.status,
          sessionId: table.sessionId,
        },
        orders: mappedOrders,
        payableTotal,
        hasOpenOrders: mappedOrders.length > 0,
        billRequested: Boolean(openBillRequest),
        billRequestedAt: openBillRequest?.createdAt || null,
      },
    };
  } catch (error) {
    console.error("guest getBill error:", error);
    return {
      status: 500,
      success: false,
      message: "Could not load the bill right now.",
      error: error.message,
    };
  }
};

const callBill = async (req) => {
  const tenantError = requireTenant(req);
  if (tenantError) return tenantError;

  try {
    const token = String(req.body?.token || req.query.token || "").trim();
    const table = await findTableByGuestToken(token);
    if (!table) {
      return {
        status: 404,
        success: false,
        message: "This table link is invalid or has been replaced.",
        data: null,
      };
    }

    if (table.status !== "occupied" || !table.sessionId) {
      return {
        status: 400,
        success: false,
        message: "There is no open bill on this table yet. Please ask a waiter.",
        data: null,
      };
    }

    const activeCount = await orderModel.count({
      where: {
        tableId: table.id,
        sessionId: table.sessionId,
        status: { [Op.notIn]: ["completed", "cancelled"] },
      },
    });

    if (activeCount === 0) {
      return {
        status: 400,
        success: false,
        message: "There is no open bill on this table yet. Please ask a waiter.",
        data: null,
      };
    }

    const recent = await serviceRequestModel.findOne({
      where: {
        tableId: table.id,
        type: "bill",
        createdAt: {
          [Op.gte]: new Date(Date.now() - CALL_BILL_COOLDOWN_MS),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    if (recent) {
      const waitSec = Math.max(
        1,
        Math.ceil(
          (CALL_BILL_COOLDOWN_MS - (Date.now() - new Date(recent.createdAt).getTime())) /
            1000,
        ),
      );
      return {
        status: 429,
        success: false,
        message: `Bill already requested. Please wait about ${waitSec}s before asking again.`,
        data: {
          cooldownSeconds: waitSec,
          requestId: recent.id,
          status: recent.status,
        },
      };
    }

    let request = await serviceRequestModel.findOne({
      where: {
        tableId: table.id,
        sessionId: table.sessionId,
        type: "bill",
        status: "open",
      },
      order: [["createdAt", "DESC"]],
    });

    if (!request) {
      request = await serviceRequestModel.create({
        tableId: table.id,
        sessionId: table.sessionId,
        type: "bill",
        status: "open",
      });
    }

    const payload = {
      type: "bill_requested",
      requestId: request.id,
      tableId: table.id,
      tableNo: table.tableNo,
      sessionId: table.sessionId,
      requestedAt: request.createdAt,
      message: `Table ${table.tableNo} requested the bill`,
    };

    broadcastToTenant(req.tenant.slug, payload);

    return {
      status: 200,
      success: true,
      message: "We've asked the staff to bring your bill.",
      data: {
        requestId: request.id,
        tableNo: table.tableNo,
        requestedAt: request.createdAt,
      },
    };
  } catch (error) {
    console.error("guest callBill error:", error);
    return {
      status: 500,
      success: false,
      message: "Could not request the bill right now.",
      error: error.message,
    };
  }
};

module.exports = {
  getMenu,
  getBill,
  callBill,
  findTableByGuestToken,
};
