"use strict";

const { Op } = require("sequelize");
const { orderModel, paymentIntentModel, tableModel, sequelize } = require("../../models");
const { config, assertEnabledConfig } = require("../../integrations/machbank-emerchant/config");
const { generateDynamicQr } = require("../../integrations/machbank-emerchant/qr.service");
const {
  MachbankConfigError,
  publicConfigMessage,
  publicBankMessage,
  logMachbankIssue,
  sanitizeRawInitiateResponse,
  sanitizeRawConfirmPayload,
} = require("../../integrations/machbank-emerchant/errors");
const { verifyGetPaySignature } = require("../../integrations/machbank-emerchant/crypto/verify-getpay");
const { syncMachbankWebSocket } = require("../../integrations/machbank-emerchant/ws-lifecycle");
const { parseNchlBillNumberFromQrPayload } = require("../../integrations/machbank-emerchant/nepalpay-qr-spec");
const { inquiryTransactionStatus } = require("../../integrations/machbank-emerchant/qr-inquiry.service");
const orderService = require("./order-service");
const { broadcastPaymentEvent } = require("../../helpers/send-notification");
const logger = require("../../configs/logger");

function buildMerchantTxnRef(orderId, attempt) {
  return `NR-${orderId}-${Date.now()}-${attempt}`;
}

function resolveNchlBillNumber(intent) {
  if (intent.nchlBillNumber) {
    return intent.nchlBillNumber;
  }
  return parseNchlBillNumberFromQrPayload(intent.qrPayload);
}

function buildSettlementLookupConditions(event) {
  const orConditions = [];
  // request_id on nqrws == NCHL validationTraceId captured at QR generation.
  if (event.requestId) {
    orConditions.push({ validationTraceId: event.requestId });
  }
  const ref = event.merchantTxnRef || event.billNumber;
  if (ref) {
    orConditions.push({ merchantTxnRef: ref });
    orConditions.push({ nchlBillNumber: ref });
    orConditions.push({ qrPayload: { [Op.like]: `%${ref}%` } });
  }
  if (event.gatewayTxnId) {
    orConditions.push({ gatewayTxnId: event.gatewayTxnId });
  }
  return orConditions;
}

function mapInquiryToGatewayEvent(inquiryData, billNumber) {
  if (!inquiryData || typeof inquiryData !== "object") {
    return null;
  }
  const row =
    inquiryData.responses?.[0] ||
    inquiryData.data ||
    inquiryData;
  const nested = row.data || row;
  const statusRaw = String(
    nested.status ||
      nested.txnStatus ||
      nested.transactionStatus ||
      row.responseStatus ||
      "",
  ).toLowerCase();
  const paid = ["success", "successful", "paid", "completed", "00", "s"].includes(
    statusRaw,
  );
  if (!paid) {
    return null;
  }
  const amount = Number(
    nested.amount ?? nested.txnAmount ?? nested.transactionAmount,
  );
  const gatewayTxnId =
    nested.gatewayTxnId ||
    nested.transactionId ||
    nested.txnId ||
    nested.nchlTxnId ||
    null;
  return {
    merchantTxnRef: billNumber,
    gatewayTxnId,
    amount: Number.isFinite(amount) ? amount : null,
    status: "paid",
    signature: nested.signature || nested.sign || null,
    raw: inquiryData,
  };
}

async function reconcilePendingIntent(intent) {
  if (!intent || intent.status !== "pending") {
    return intent;
  }

  const nchlBill = resolveNchlBillNumber(intent);
  const billNumbers = [...new Set([nchlBill, intent.merchantTxnRef].filter(Boolean))];

  for (const billNumber of billNumbers) {
    const inquiry = await inquiryTransactionStatus({
      billNumber,
      referenceLabel: billNumber,
    });
    const event = mapInquiryToGatewayEvent(inquiry, billNumber);
    if (event) {
      await settleFromGatewayEvent(event);
      return paymentIntentModel.findByPk(intent.id, {
        include: [
          {
            model: orderModel,
            as: "order",
            attributes: ["id", "paymentStatus", "payableAmount"],
          },
        ],
      });
    }
  }

  return intent;
}

const initiateQrPayment = async (req) => {
  try {
    try {
      assertEnabledConfig();
    } catch (configError) {
      if (configError instanceof MachbankConfigError) {
        return {
          status: 503,
          success: false,
          message: publicConfigMessage(configError.code),
        };
      }
      logMachbankIssue("initiateQrPayment config", { message: configError.message });
      return {
        status: 503,
        success: false,
        message: publicConfigMessage(),
      };
    }

    const { orderId, amount, accountId, tableId, checkoutAll } = req.body;
    const userId = req.user.id;

    // Two modes: settle a single order, or settle EVERY active order on a table
    // with one combined QR (checkoutAll). For checkoutAll the first active order
    // is the "anchor" stored on orderId; settlement completes all of them.
    const isTableCheckoutAll = Boolean(checkoutAll && tableId);

    let anchorOrderId;
    let sessionId = null;
    let payableBalance;
    let existingWhere;

    if (isTableCheckoutAll) {
      const table = await tableModel.findByPk(tableId);
      if (!table || !table.sessionId) {
        return {
          status: 400,
          success: false,
          message: "No active session for this table",
        };
      }

      const activeOrders = await orderModel.findAll({
        where: {
          tableId,
          sessionId: table.sessionId,
          status: { [Op.notIn]: ["completed", "cancelled"] },
        },
        order: [["createdAt", "ASC"]],
      });
      if (!activeOrders.length) {
        return {
          status: 400,
          success: false,
          message: "No active orders to checkout for this table",
        };
      }

      sessionId = table.sessionId;
      anchorOrderId = activeOrders[0].id;
      payableBalance = activeOrders.reduce(
        (sum, o) => sum + Number(o.payableAmount ?? o.totalAmount ?? 0),
        0,
      );
      existingWhere = {
        tableId,
        checkoutAll: true,
        status: "pending",
        expiresAt: { [Op.gt]: new Date() },
      };
    } else {
      const order = await orderModel.findByPk(orderId);
      if (!order) {
        return { status: 404, success: false, message: "Order not found" };
      }
      if (["completed", "cancelled"].includes(order.status)) {
        return {
          status: 400,
          success: false,
          message: "Cannot create QR payment for a closed order",
        };
      }
      anchorOrderId = order.id;
      payableBalance = Number(order.payableAmount ?? order.totalAmount);
      existingWhere = {
        orderId,
        checkoutAll: false,
        status: "pending",
        expiresAt: { [Op.gt]: new Date() },
      };
    }

    const payAmount = amount != null ? Number(amount) : payableBalance;
    if (!payAmount || payAmount <= 0) {
      return { status: 400, success: false, message: "Invalid payment amount" };
    }
    if (payAmount > payableBalance + 0.01) {
      return {
        status: 400,
        success: false,
        message: `Amount exceeds payable balance (${payableBalance})`,
      };
    }

    const existingPending = await paymentIntentModel.findOne({
      where: existingWhere,
    });
    if (existingPending) {
      await syncMachbankWebSocket();
      return {
        status: 200,
        success: true,
        message: "Existing pending QR payment returned",
        data: formatIntentResponse(existingPending),
      };
    }

    const priorAttempts = await paymentIntentModel.count({
      where: isTableCheckoutAll
        ? { tableId, checkoutAll: true }
        : { orderId },
    });
    const attempt = priorAttempts + 1;
    const merchantTxnRef = buildMerchantTxnRef(anchorOrderId, attempt);
    const expiresAt = new Date(
      Date.now() + config.qrExpirySeconds * 1000,
    );

    // Pre-fill the payer-facing remarks/purpose (EMVCo tag 62-08) so the
    // customer can just pay without typing anything in their bank app.
    const purposeOfTransaction = config.qrPurpose || "Payment of food";

    let qrResult;
    try {
      qrResult = await generateDynamicQr({
        amount: payAmount,
        merchantTxnRef,
        purposeOfTransaction,
      });
    } catch (err) {
      logMachbankIssue("generateDynamicQr failed", {
        message: err.message,
        bankCode: err.bankCode,
        response: err.responseData || err.response?.data,
      });
      return {
        status: 502,
        success: false,
        message: publicBankMessage(),
      };
    }

    const nchlBillNumber = parseNchlBillNumberFromQrPayload(qrResult.qrPayload);

    const intent = await paymentIntentModel.create({
      orderId: anchorOrderId,
      tableId: isTableCheckoutAll ? Number(tableId) : null,
      sessionId,
      checkoutAll: isTableCheckoutAll,
      amount: payAmount,
      currency: config.currency,
      merchantTxnRef,
      nchlBillNumber,
      validationTraceId: qrResult.validationTraceId || null,
      status: "pending",
      qrPayload: qrResult.qrPayload,
      qrImageUrl: qrResult.qrImageUrl,
      expiresAt,
      accountId: accountId || null,
      userId,
      attempt,
      rawInitiateResponse: sanitizeRawInitiateResponse(qrResult.raw),
    });

    await orderModel.update(
      { paymentStatus: "pending" },
      {
        where: isTableCheckoutAll
          ? {
              tableId,
              sessionId,
              status: { [Op.notIn]: ["completed", "cancelled"] },
            }
          : { id: anchorOrderId },
      },
    );

    await syncMachbankWebSocket();

    return {
      status: 201,
      success: true,
      message: "QR payment initiated",
      data: formatIntentResponse(intent),
    };
  } catch (error) {
    logMachbankIssue("initiateQrPayment", { message: error.message });
    return {
      status: 500,
      success: false,
      message: "Unable to start QR payment. Try again or contact support.",
    };
  }
};

const getIntentStatus = async (req) => {
  let intent = await paymentIntentModel.findByPk(req.params.id, {
    include: [{ model: orderModel, as: "order", attributes: ["id", "paymentStatus", "payableAmount"] }],
  });
  if (!intent) {
    return { status: 404, success: false, message: "Payment intent not found" };
  }

  if (intent.status === "pending") {
    intent = (await reconcilePendingIntent(intent)) || intent;
  }

  return {
    status: 200,
    success: true,
    data: formatIntentResponse(intent),
  };
};

const cancelIntent = async (req) => {
  const intent = await paymentIntentModel.findByPk(req.params.id);
  if (!intent) {
    return { status: 404, success: false, message: "Payment intent not found" };
  }
  if (intent.status !== "pending") {
    return {
      status: 400,
      success: false,
      message: `Cannot cancel intent with status ${intent.status}`,
    };
  }
  await intent.update({ status: "cancelled" });
  await syncMachbankWebSocket();
  return {
    status: 200,
    success: true,
    message: "Payment intent cancelled",
    data: formatIntentResponse(intent),
  };
};

const settleFromGatewayEvent = async (event) => {
  const transaction = await sequelize.transaction();
  try {
    const orConditions = buildSettlementLookupConditions(event);
    if (!orConditions.length) {
      await transaction.rollback();
      return { handled: false, reason: "missing_lookup_keys" };
    }

    const intent = await paymentIntentModel.findOne({
      where: { status: "pending", [Op.or]: orConditions },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!intent) {
      await transaction.rollback();
      logger.warn(
        "No pending payment intent matched gateway event " +
          `(status=${event.status} request_id=${event.requestId || "?"} ` +
          `ref=${event.merchantTxnRef || "?"} gatewayTxnId=${event.gatewayTxnId || "?"}). ` +
          "If a payment was made, the bank's request_id does not match any stored validationTraceId.",
      );
      return { handled: false };
    }

    if (intent.status === "paid") {
      await transaction.commit();
      await syncMachbankWebSocket();
      return { handled: true, duplicate: true };
    }

    if (event.status === "failed") {
      await intent.update(
        {
          status: "failed",
          rawConfirmPayload: event.raw,
          gatewayTxnId: event.gatewayTxnId || intent.gatewayTxnId,
        },
        { transaction },
      );
      await transaction.commit();
      await syncMachbankWebSocket();
      return { handled: true };
    }

    if (event.status !== "paid") {
      await transaction.rollback();
      return { handled: false };
    }

    // The nqrws validationTraceId is a bank-issued secret (server-to-server over
    // mTLS, never in the QR) — a trace-id match authenticates the WS event even
    // without a getpay signature, which NCHL WsTxnRecord does not carry.
    const matchedByTrace = Boolean(
      event.requestId && intent.validationTraceId === event.requestId,
    );

    if (event.signature) {
      if (!verifyGetPaySignature(event, event.signature)) {
        await transaction.rollback();
        logger.error("getpay signature verification failed");
        return { handled: false, reason: "invalid_signature" };
      }
    } else if (!matchedByTrace && config.requireGetpaySignature) {
      await transaction.rollback();
      logger.error(
        "Rejected paid event: no getpay signature and no validationTraceId match (MACHBANK_REQUIRE_GETPAY_SIGNATURE)",
      );
      return { handled: false, reason: "untrusted_event" };
    }

    const confirmedAmount = event.amount ?? Number(intent.amount);
    if (Math.abs(confirmedAmount - Number(intent.amount)) > 0.01) {
      await transaction.rollback();
      logger.error(
        `Amount mismatch intent=${intent.amount} confirmed=${confirmedAmount}`,
      );
      return { handled: false, reason: "amount_mismatch" };
    }

    await intent.update(
      {
        status: "paid",
        gatewayTxnId: event.gatewayTxnId || intent.gatewayTxnId,
        rawConfirmPayload: sanitizeRawConfirmPayload(event),
      },
      { transaction },
    );

    const settleResult = intent.checkoutAll
      ? await orderService.finalizeQrPaymentForTable(
          {
            tableId: intent.tableId,
            sessionId: intent.sessionId,
            accountId: intent.accountId,
            userId: intent.userId,
            paymentIntentId: intent.id,
            gatewayReference: event.gatewayTxnId || intent.merchantTxnRef,
            remarks: `NEPALPAY QR ${intent.merchantTxnRef}`,
          },
          transaction,
        )
      : await orderService.finalizeQrPayment(
          {
            orderId: intent.orderId,
            amount: Number(intent.amount),
            accountId: intent.accountId,
            userId: intent.userId,
            paymentIntentId: intent.id,
            gatewayReference: event.gatewayTxnId || intent.merchantTxnRef,
            remarks: `NEPALPAY QR ${intent.merchantTxnRef}`,
          },
          transaction,
        );

    if (!settleResult.success) {
      await transaction.rollback();
      return { handled: false, reason: settleResult.message };
    }

    await transaction.commit();

    broadcastPaymentEvent({
      type: "payment_received",
      orderId: intent.orderId,
      paymentIntentId: intent.id,
      amount: Number(intent.amount),
      merchantTxnRef: intent.merchantTxnRef,
      gatewayTxnId: event.gatewayTxnId,
    });

    await syncMachbankWebSocket();

    return { handled: true, intentId: intent.id };
  } catch (err) {
    await transaction.rollback();
    logger.error("settleFromGatewayEvent", err.message);
    throw err;
  }
};

function formatIntentResponse(intent) {
  const plain = intent.toJSON ? intent.toJSON() : intent;
  return {
    id: plain.id,
    orderId: plain.orderId,
    amount: Number(plain.amount),
    currency: plain.currency,
    merchantTxnRef: plain.merchantTxnRef,
    nchlBillNumber: plain.nchlBillNumber,
    gatewayTxnId: plain.gatewayTxnId,
    status: plain.status,
    qrPayload: plain.qrPayload,
    qrImageUrl: plain.qrImageUrl,
    expiresAt: plain.expiresAt,
    accountId: plain.accountId,
    attempt: plain.attempt,
    createdAt: plain.createdAt,
    order: plain.order,
  };
}

module.exports = {
  initiateQrPayment,
  getIntentStatus,
  cancelIntent,
  settleFromGatewayEvent,
};
