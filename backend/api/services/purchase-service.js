const {
  purchaseModel,
  purchaseItemModel,
  accountModel,
  supplierModel,
  purchaseCategoryModel,
  sequelize,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");
const { Sequelize } = require("sequelize");

const create = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      supplierId,
      invoiceDate,
      invoiceNumber,
      paymentTerms,
      accountId,
      discountAmount,
      items,
      notes,
    } = req.body;

    // Validate references
    const supplier = await supplierModel.findByPk(supplierId, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }
    const account = await accountModel.findByPk(accountId, { transaction });
    if (!account || account.status !== "active") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invalid or inactive account",
        data: null,
      };
    }

    // Check invoiceNumber uniqueness
    const existingPurchase = await purchaseModel.findOne({
      where: { invoiceNumber },
      transaction,
    });
    if (existingPurchase) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Invoice number already exists",
        data: null,
      };
    }

    const purchase = await purchaseModel.create(
      {
        supplierId,
        invoiceDate,
        invoiceNumber,
        paymentTerms,
        accountId,
        enteredByUserId: req.user.id,
        status: "draft",
        discountAmount: discountAmount || 0,
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes,
      },
      { transaction },
    );

    let subtotal = 0,
      taxAmount = 0;
    for (const item of items) {
      const amount = item.quantity * item.rate;
      const itemTax = item.isTaxable ? amount * 0.13 : 0; // Customize tax rate
      taxAmount += itemTax;
      subtotal += amount;

      await purchaseItemModel.create(
        {
          purchaseId: purchase.id,
          categoryId: item.categoryId,
          hsCode: item.hsCode,
          particulars: item.particulars,
          quantity: item.quantity,
          rate: item.rate,
          amount,
          isTaxable: item.isTaxable,
        },
        { transaction },
      );
    }

    const totalAmount = subtotal - purchase.discountAmount + taxAmount;
    await purchase.update(
      { subtotal, taxAmount, totalAmount },
      { transaction },
    );

    const result = await purchaseModel.findByPk(purchase.id, {
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE.CREATE_PURCHASE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const list = async (req) => {
  try {
    const { limit, page, supplierId, status } = req.query;
    const filters = {};
    if (supplierId) filters.supplierId = supplierId;
    if (status) filters.status = status;
    const include = [
      { model: supplierModel, as: "supplier" },
      {
        model: purchaseItemModel,
        as: "purchaseItems",
        include: [{ model: purchaseCategoryModel, as: "category" }],
      },
    ];
    const order = [["createdAt", "DESC"]];

    const result = await paginate(purchaseModel, {
      limit,
      page,
      filters,
      include,
      order,
    });

    if (!result) {
      return {
        ...generalConstant.EN.PURCHASE.PURCHASE_LIST_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PURCHASE.PURCHASE_LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

const getById = async (req) => {
  try {
    const purchase = await purchaseModel.findByPk(+req.params.id, {
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
    });

    if (!purchase) {
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }
    return {
      ...generalConstant.EN.PURCHASE.PURCHASE_GET_SUCCESS,
      data: purchase,
    };
  } catch (error) {
    throw error;
  }
};

const updateById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const purchase = await purchaseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!purchase) {
      await transaction.rollback();
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }
    if (purchase.status !== "draft") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Only draft purchases can be updated",
        data: null,
      };
    }

    const {
      supplierId,
      invoiceDate,
      invoiceNumber,
      paymentTerms,
      accountId,
      discountAmount,
      items,
      notes,
    } = req.body;

    // Validate references if provided
    if (supplierId) {
      const supplier = await supplierModel.findByPk(supplierId, {
        transaction,
      });
      if (!supplier) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Supplier not found",
          data: null,
        };
      }
    }
    if (accountId) {
      const account = await accountModel.findByPk(accountId, { transaction });
      if (!account || account.status !== "active") {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invalid or inactive account",
          data: null,
        };
      }
    }
    if (invoiceNumber) {
      const existingPurchase = await purchaseModel.findOne({
        where: { invoiceNumber, id: { [Sequelize.Op.ne]: purchase.id } },
        transaction,
      });
      if (existingPurchase) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Invoice number already exists",
          data: null,
        };
      }
    }

    // Update purchase
    const updateData = {};
    if (supplierId) updateData.supplierId = supplierId;
    if (invoiceDate) updateData.invoiceDate = invoiceDate;
    if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
    if (paymentTerms) updateData.paymentTerms = paymentTerms;
    if (accountId) updateData.accountId = accountId;
    if (discountAmount !== undefined)
      updateData.discountAmount = discountAmount;
    if (notes !== undefined) updateData.notes = notes;

    await purchase.update(updateData, { transaction });

    // Update items if provided
    if (items && Array.isArray(items)) {
      await purchaseItemModel.destroy({
        where: { purchaseId: purchase.id },
        transaction,
      });

      let subtotal = 0,
        taxAmount = 0;
      for (const item of items) {
        const amount = item.quantity * item.rate;
        const itemTax = item.isTaxable ? amount * 0.13 : 0;
        taxAmount += itemTax;
        subtotal += amount;

        await purchaseItemModel.create(
          {
            purchaseId: purchase.id,
            categoryId: item.categoryId,
            hsCode: item.hsCode,
            particulars: item.particulars,
            quantity: item.quantity,
            rate: item.rate,
            amount,
            isTaxable: item.isTaxable,
          },
          { transaction },
        );
      }

      const totalAmount = subtotal - purchase.discountAmount + taxAmount;
      await purchase.update(
        { subtotal, taxAmount, totalAmount },
        { transaction },
      );
    }

    const updatedPurchase = await purchaseModel.findByPk(purchase.id, {
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE.UPDATE_PURCHASE_SUCCESS,
      data: updatedPurchase,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const completePurchase = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const purchase = await purchaseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!purchase) {
      await transaction.rollback();
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }
    if (purchase.status !== "draft") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Purchase is not in draft status",
        data: null,
      };
    }

    await purchase.update({ status: "completed" }, { transaction });

    if (purchase.paymentTerms !== "credit") {
      const account = await accountModel.findByPk(purchase.accountId, {
        transaction,
        lock: true,
      });
      if (!account) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: "Account not found",
          data: null,
        };
      }

      // Refreshing the account to get the latest balance
      await account.reload({ transaction });

      // Convert to numbers for proper comparison
      const availableBalance = parseFloat(account.currentBalance);
      const requiredAmount = parseFloat(purchase.totalAmount);

      if (availableBalance < requiredAmount) {
        await transaction.rollback();
        return {
          status: 400,
          success: false,
          message: `Insufficient account balance. Available: ${availableBalance}, Required: ${requiredAmount}`,
          data: null,
        };
      }
      await account.decrement("currentBalance", {
        by: purchase.totalAmount,
        transaction,
      });
    }

    const result = await purchaseModel.findByPk(purchase.id, {
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE.COMPLETE_PURCHASE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const recordCreditPayment = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const purchase = await purchaseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!purchase) {
      await transaction.rollback();
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }
    if (purchase.paymentTerms !== "credit") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Not a credit purchase",
        data: null,
      };
    }
    if (purchase.status !== "completed") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Purchase is not completed",
        data: null,
      };
    }
    if (purchase.paymentDate) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Purchase already paid",
        data: null,
      };
    }

    // Determine payment account: use req.body.paymentAccountId if provided, else purchase.accountId
    const paymentAccountId = req.body.paymentAccountId || purchase.accountId;
    const account = await accountModel.findByPk(paymentAccountId, {
      transaction,
      lock: true,
    });
    if (!account) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Account not found",
        data: null,
      };
    }

    // Refresh the account to get the latest balance
    await account.reload({ transaction });

    // Convert to numbers for proper comparison
    const availableBalance = Number(account.currentBalance);
    const requiredAmount = Number(purchase.totalAmount);

    if (availableBalance < requiredAmount) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: `Insufficient account balance. Available: ${availableBalance}, Required: ${requiredAmount}`,
        data: null,
      };
    }

    // Update purchase with payment details
    await purchase.update(
      {
        paidByUserId: req.user.id,
        paymentDate: new Date(),
        paymentAccountId: paymentAccountId, // Record the actual payment account used
      },
      { transaction },
    );

    // Deduct from the payment account
    await account.decrement("currentBalance", {
      by: Number(purchase.totalAmount),
      transaction,
    });

    const result = await purchaseModel.findByPk(purchase.id, {
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE.PAY_PURCHASE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelPurchase = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const purchase = await purchaseModel.findByPk(+req.params.id, {
      transaction,
    });
    if (!purchase) {
      await transaction.rollback();
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }
    if (purchase.status === "cancelled") {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Purchase already cancelled",
        data: null,
      };
    }
    if (purchase.paymentDate) {
      await transaction.rollback();
      return {
        status: 400,
        success: false,
        message: "Cannot cancel paid purchase",
        data: null,
      };
    }

    await purchase.update({ status: "cancelled" }, { transaction });

    const result = await purchaseModel.findByPk(purchase.id, {
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
      transaction,
    });

    await transaction.commit();
    return {
      ...generalConstant.EN.PURCHASE.CANCEL_PURCHASE_SUCCESS,
      data: result,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getUnpaidCredits = async (req) => {
  try {
    const { supplierId } = req.query;
    const filters = {
      paymentTerms: "credit",
      status: "completed",
      paymentDate: null,
    };
    if (supplierId) filters.supplierId = supplierId;

    const result = await paginate(purchaseModel, {
      limit: req.query.limit,
      page: req.query.page,
      filters,
      include: [
        { model: supplierModel, as: "supplier" },
        {
          model: purchaseItemModel,
          as: "purchaseItems",
          include: [{ model: purchaseCategoryModel, as: "category" }],
        },
      ],
      order: [["invoiceDate", "ASC"]],
    });

    if (!result) {
      return {
        ...generalConstant.EN.PURCHASE.UNPAID_CREDITS_FAILURE,
        data: null,
      };
    }
    return {
      ...generalConstant.EN.PURCHASE.UNPAID_CREDITS_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// Delete purchase and refund account if applicable
const deleteById = async (req) => {
  const transaction = await sequelize.transaction();
  try {
    const id = +req.params.id;
    const purchase = await purchaseModel.findByPk(id, { transaction, lock: true });
    if (!purchase) {
      await transaction.rollback();
      return { ...generalConstant.EN.PURCHASE.PURCHASE_NOT_FOUND, data: null };
    }

    // Determine refund behavior
    let refundAccountId = null;
    let refundAmount = 0;

    if (purchase.status === "draft") {
      // No refund for drafts; they don't affect accounts
      refundAccountId = null;
    } else if (purchase.status === "completed") {
      // Completed purchases may have affected an account
      refundAmount = Number(purchase.totalAmount) || 0;
      if (purchase.paymentTerms === "credit") {
        // If credit purchase is already paid (paymentDate set), refund the payment account if known
        if (purchase.paymentDate) {
          // paymentAccountId may be present if your schema has it; else fallback to accountId
          refundAccountId = purchase.paymentAccountId || purchase.accountId;
        } else {
          // Unpaid credit purchase – no account deduction happened yet
          refundAccountId = null;
        }
      } else {
        // Non-credit purchase: amount was deducted from purchase.accountId on completion
        refundAccountId = purchase.accountId;
      }
    } else if (purchase.status === "cancelled") {
      // Cancelled purchases generally should not have led to deductions per service logic
      refundAccountId = null;
    }

    // Process refund if needed
    if (refundAccountId && refundAmount > 0) {
      const account = await accountModel.findByPk(refundAccountId, {
        transaction,
        lock: true,
      });
      if (account) {
        await account.increment("currentBalance", {
          by: refundAmount,
          transaction,
        });
      }
    }

    // Delete children first due to FK, then the purchase
    await purchaseItemModel.destroy({ where: { purchaseId: purchase.id }, transaction });
    await purchase.destroy({ transaction });

    await transaction.commit();
    return {
      status: 200,
      success: true,
      message: "Purchase deleted successfully",
      data: { id },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  create,
  list,
  getById,
  updateById,
  completePurchase,
  recordCreditPayment,
  cancelPurchase,
  getUnpaidCredits,
  deleteById,
};
