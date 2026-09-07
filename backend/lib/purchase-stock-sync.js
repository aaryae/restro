"use strict";

const {
  purchaseModel,
  purchaseItemModel,
  accountModel,
  supplierModel,
  stockItemModel,
  stockHistoryModel,
} = require("../models");

const REFERENCE_TYPE = "purchase";

const toNumber = (value) => Number(value || 0);

class PurchaseStockSyncError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PurchaseStockSyncError";
    this.status = status;
    this.success = false;
  }

  toResponse() {
    return {
      status: this.status,
      success: false,
      message: this.message,
      data: null,
    };
  }
}

const purchaseLabel = (purchase) => {
  if (purchase?.invoiceNumber) return `Purchase ${purchase.invoiceNumber}`;
  return `Purchase #${purchase?.id}`;
};

/**
 * Increase stock for every purchase line linked to a stock item.
 * Idempotent: if any history already references this purchase, no-op.
 */
const applyPurchaseToStock = async (
  purchaseId,
  { transaction, userId = null } = {},
) => {
  const id = Number(purchaseId);
  if (!id) {
    throw new PurchaseStockSyncError("Invalid purchase id");
  }

  const existingCount = await stockHistoryModel.count({
    where: { referenceType: REFERENCE_TYPE, referenceId: id },
    transaction,
  });
  if (existingCount > 0) {
    return { applied: false, reason: "already_applied" };
  }

  const purchase = await purchaseModel.findByPk(id, {
    include: [
      {
        model: purchaseItemModel,
        as: "purchaseItems",
        required: false,
      },
    ],
    transaction,
  });

  if (!purchase) {
    throw new PurchaseStockSyncError("Purchase not found", 404);
  }

  const linkedLines = (purchase.purchaseItems || []).filter(
    (line) => line.stockItemId,
  );
  if (linkedLines.length === 0) {
    return { applied: false, reason: "no_linked_items" };
  }

  const note = `${purchaseLabel(purchase)} — stock received`;

  for (const line of linkedLines) {
    const stockItem = await stockItemModel.findByPk(line.stockItemId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!stockItem) {
      throw new PurchaseStockSyncError(
        `Stock item #${line.stockItemId} not found for purchase line`,
      );
    }

    const qty = toNumber(line.quantity);
    const rate = toNumber(line.rate);
    if (qty <= 0) continue;

    const nextQty = toNumber(stockItem.quantity) + qty;
    await stockItem.update({ quantity: nextQty }, { transaction });

    await stockHistoryModel.create(
      {
        stockItemId: stockItem.id,
        type: "purchase",
        quantity: qty,
        rate,
        value: qty * rate,
        note,
        referenceType: REFERENCE_TYPE,
        referenceId: purchase.id,
        createdBy: userId || null,
      },
      { transaction },
    );
  }

  return { applied: true };
};

/**
 * Reverse stock movements previously applied from a purchase.
 * Rejects if any linked item no longer has enough quantity.
 */
const reversePurchaseFromStock = async (
  purchaseId,
  { transaction } = {},
) => {
  const id = Number(purchaseId);
  if (!id) {
    throw new PurchaseStockSyncError("Invalid purchase id");
  }

  const histories = await stockHistoryModel.findAll({
    where: { referenceType: REFERENCE_TYPE, referenceId: id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (histories.length === 0) {
    return { reversed: false, reason: "nothing_to_reverse" };
  }

  for (const history of histories) {
    const stockItem = await stockItemModel.findByPk(history.stockItemId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!stockItem) {
      throw new PurchaseStockSyncError(
        `Stock item #${history.stockItemId} not found while reversing purchase`,
      );
    }

    const qty = toNumber(history.quantity);
    const currentQty = toNumber(stockItem.quantity);
    if (qty > currentQty) {
      throw new PurchaseStockSyncError(
        `Cannot reverse purchase #${id}: stock "${stockItem.name}" only has ${currentQty} left (need to remove ${qty})`,
      );
    }

    await stockItem.update(
      { quantity: currentQty - qty },
      { transaction },
    );
  }

  await stockHistoryModel.destroy({
    where: { referenceType: REFERENCE_TYPE, referenceId: id },
    transaction,
  });

  return { reversed: true, count: histories.length };
};

/**
 * Create a completed finance purchase from an inventory Purchase/Restock adjust.
 * Does not change stock quantities — call applyPurchaseToStock afterwards.
 */
const createCompletedPurchaseForStockAdjust = async ({
  stockItem,
  quantity,
  rate,
  accountId,
  supplierId,
  paymentTerms = "cash",
  enteredByUserId,
  note = null,
  transaction,
}) => {
  const qty = toNumber(quantity);
  const unitRate = toNumber(rate);
  const terms = paymentTerms || "cash";

  if (qty <= 0) {
    throw new PurchaseStockSyncError("Quantity must be greater than 0");
  }
  if (!stockItem?.id) {
    throw new PurchaseStockSyncError("Stock item is required");
  }
  if (!enteredByUserId) {
    throw new PurchaseStockSyncError("User is required to record purchase");
  }

  const supplier = await supplierModel.findByPk(supplierId, { transaction });
  if (!supplier) {
    throw new PurchaseStockSyncError("Supplier not found");
  }

  const account = await accountModel.findByPk(accountId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!account || account.status !== "active") {
    throw new PurchaseStockSyncError("Invalid or inactive account");
  }

  const amount = qty * unitRate;
  const subtotal = amount;
  const taxAmount = 0;
  const totalAmount = subtotal;

  if (terms !== "credit") {
    await account.reload({ transaction });
    const availableBalance = parseFloat(account.currentBalance);
    if (availableBalance < totalAmount) {
      throw new PurchaseStockSyncError(
        `Insufficient account balance. Available: ${availableBalance}, Required: ${totalAmount}`,
      );
    }
    await account.decrement("currentBalance", {
      by: totalAmount,
      transaction,
    });
  }

  const purchaseNotes = [
    `Inventory restock: ${stockItem.name}`,
    note ? String(note).trim() : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const purchase = await purchaseModel.create(
    {
      supplierId: supplier.id,
      invoiceDate: new Date(),
      invoiceNumber: null,
      paymentTerms: terms,
      accountId: account.id,
      enteredByUserId,
      discountAmount: 0,
      subtotal,
      taxAmount,
      totalAmount,
      status: "completed",
      paymentDate: terms === "credit" ? null : new Date(),
      notes: purchaseNotes || null,
    },
    { transaction },
  );

  await purchaseItemModel.create(
    {
      purchaseId: purchase.id,
      categoryId: null,
      stockItemId: stockItem.id,
      particulars: stockItem.name,
      quantity: qty,
      rate: unitRate,
      amount,
      isTaxable: false,
    },
    { transaction },
  );

  return purchase;
};

module.exports = {
  REFERENCE_TYPE,
  PurchaseStockSyncError,
  applyPurchaseToStock,
  reversePurchaseFromStock,
  createCompletedPurchaseForStockAdjust,
};
