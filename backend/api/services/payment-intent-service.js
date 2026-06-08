"use strict";

const { Op } = require("sequelize");
const { orderModel, paymentIntentModel, sequelize } = require("../../models");
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

    const { orderId, amount, accountId } = req.body;
    const userId = req.user.id;

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

    const payable = Number(order.payableAmount ?? order.totalAmount);
    const payAmount = amount != null ? Number(amount) : payable;
    if (!payAmount || payAmount <= 0) {
      return { status: 400, success: false, message: "Invalid payment amount" };
    }
    if (payAmount > payable + 0.01) {
      return {
        status: 400,
        success: false,
        message: `Amount exceeds payable balance (${payable})`,
      };
    }

    const existingPending = await paymentIntentModel.findOne({
      where: { orderId, status: "pending", expiresAt: { [Op.gt]: new Date() } },
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

    const priorAttempts = await paymentIntentModel.count({ where: { orderId } });
    const attempt = priorAttempts + 1;
    const merchantTxnRef = buildMerchantTxnRef(orderId, attempt);
    const expiresAt = new Date(
      Date.now() + config.qrExpirySeconds * 1000,
    );

    let qrResult;
    try {
      qrResult = await generateDynamicQr({
        amount: payAmount,
        merchantTxnRef,
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
      orderId,
      amount: payAmount,
      currency: config.currency,
      merchantTxnRef,
      nchlBillNumber,
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
      { where: { id: orderId } },
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
        `No payment intent for gateway event ref=${event.merchantTxnRef}`,
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

    if (config.requireGetpaySignature && !event.signature) {
      await transaction.rollback();
      logger.error(
        "Rejected paid event: missing getpay signature (MACHBANK_REQUIRE_GETPAY_SIGNATURE)",
      );
      return { handled: false, reason: "missing_signature" };
    }

    if (
      event.signature &&
      !verifyGetPaySignature(event, event.signature)
    ) {
      await transaction.rollback();
      logger.error("getpay signature verification failed");
      return { handled: false, reason: "invalid_signature" };
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

    const settleResult = await orderService.finalizeQrPayment(
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
