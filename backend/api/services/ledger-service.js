const { Op } = require("sequelize");
const { startOfDay, endOfDay, parseISO, subDays } = require("date-fns");
const {
  revenueModel,
  expenseModel,
  purchaseModel,
  transactionModel,
  transferModel,
  accountModel,
  userModel,
} = require("../../models");

const USER_ATTRS = ["id", "firstName", "lastName", "username"];
const ACCOUNT_ATTRS = ["id", "name", "accountType"];

const toNumber = (value) => Number(value || 0);

const formatUserName = (user) => {
  if (!user) return null;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.username || null;
};

const resolveDateRange = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      start: startOfDay(parseISO(startDate)),
      end: endOfDay(parseISO(endDate)),
    };
  }
  if (startDate) {
    return {
      start: startOfDay(parseISO(startDate)),
      end: endOfDay(parseISO(startDate)),
    };
  }
  if (endDate) {
    return {
      start: startOfDay(parseISO(endDate)),
      end: endOfDay(parseISO(endDate)),
    };
  }
  // Default: last 30 days so unbounded queries stay practical
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, 29));
  return { start, end };
};

const buildEntry = ({
  id,
  source,
  category,
  direction,
  amount,
  entryDate,
  remarks,
  account,
  user,
  counterpartyAccount = null,
  reference = null,
}) => ({
  id: `${source}-${id}-${direction}`,
  sourceId: id,
  source,
  category,
  direction,
  amount: toNumber(amount),
  entryDate,
  remarks: remarks || null,
  account: account
    ? {
        id: account.id,
        name: account.name,
        accountType: account.accountType,
      }
    : null,
  counterpartyAccount: counterpartyAccount
    ? {
        id: counterpartyAccount.id,
        name: counterpartyAccount.name,
        accountType: counterpartyAccount.accountType,
      }
    : null,
  user: user
    ? {
        id: user.id,
        username: user.username,
        name: formatUserName(user),
      }
    : null,
  reference,
});

const matchesDirection = (entry, direction) => {
  if (!direction || direction === "all") return true;
  return entry.direction === direction;
};

const matchesCategory = (entry, category) => {
  if (!category || category === "all") return true;
  return entry.category === category;
};

const matchesAccountType = (entry, accountType) => {
  if (!accountType) return true;
  const types = String(accountType)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!types.length) return true;
  return entry.account && types.includes(entry.account.accountType);
};

const buildAccountInclude = (accountType) => ({
  model: accountModel,
  as: "account",
  attributes: ACCOUNT_ATTRS,
  required: true,
  ...(accountType
    ? {
        where: {
          accountType: {
            [Op.in]: String(accountType)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          },
        },
      }
    : {}),
});

const buildUserInclude = (as = "user") => ({
  model: userModel,
  as,
  attributes: USER_ATTRS,
  required: false,
});

const list = async (req) => {
  try {
    let {
      limit = 20,
      page = 1,
      accountId,
      accountType,
      direction,
      category,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 5000);
    const { start, end } = resolveDateRange(startDate, endDate);
    const parsedAccountId = accountId ? Number(accountId) : null;

    const dateBetween = { [Op.between]: [start, end] };

    const revenueWhere = {
      createdAt: dateBetween,
      ...(parsedAccountId ? { accountId: parsedAccountId } : {}),
    };

    const expenseWhere = {
      [Op.and]: [
        {
          [Op.or]: [
            { paymentDate: dateBetween },
            {
              paymentDate: null,
              createdAt: dateBetween,
            },
          ],
        },
        ...(parsedAccountId ? [{ accountId: parsedAccountId }] : []),
      ],
    };

    const purchaseWhere = {
      status: "completed",
      [Op.and]: [
        {
          [Op.or]: [
            { paymentTerms: { [Op.in]: ["cash", "cheque"] } },
            { paymentDate: { [Op.ne]: null } },
          ],
        },
        {
          [Op.or]: [
            { paymentDate: dateBetween },
            {
              paymentDate: null,
              createdAt: dateBetween,
            },
          ],
        },
        ...(parsedAccountId ? [{ accountId: parsedAccountId }] : []),
      ],
    };

    const transactionWhere = {
      transactionDate: dateBetween,
      ...(parsedAccountId ? { accountId: parsedAccountId } : {}),
    };

    const transferWhere = {
      transferDate: dateBetween,
      ...(parsedAccountId
        ? {
            [Op.or]: [
              { fromAccountId: parsedAccountId },
              { toAccountId: parsedAccountId },
            ],
          }
        : {}),
    };

    const [
      revenues,
      expenses,
      purchases,
      transactions,
      transfers,
    ] = await Promise.all([
      revenueModel.findAll({
        where: revenueWhere,
        include: [buildAccountInclude(accountType), buildUserInclude()],
        order: [["createdAt", "DESC"]],
      }),
      expenseModel.findAll({
        where: expenseWhere,
        include: [buildAccountInclude(accountType), buildUserInclude()],
        order: [["createdAt", "DESC"]],
      }),
      purchaseModel.findAll({
        where: purchaseWhere,
        include: [
          buildAccountInclude(accountType),
          buildUserInclude("enteredByUser"),
        ],
        order: [["createdAt", "DESC"]],
      }),
      transactionModel.findAll({
        where: transactionWhere,
        include: [buildAccountInclude(accountType), buildUserInclude()],
        order: [["transactionDate", "DESC"]],
      }),
      transferModel.findAll({
        where: transferWhere,
        include: [
          {
            model: accountModel,
            as: "fromAccount",
            attributes: ACCOUNT_ATTRS,
            required: true,
          },
          {
            model: accountModel,
            as: "toAccount",
            attributes: ACCOUNT_ATTRS,
            required: true,
          },
          buildUserInclude(),
        ],
        order: [["transferDate", "DESC"]],
      }),
    ]);

    const entries = [];

    for (const row of revenues) {
      entries.push(
        buildEntry({
          id: row.id,
          source: "revenue",
          category: "revenue",
          direction: "in",
          amount: row.amount,
          entryDate: row.createdAt,
          remarks: row.remarks,
          account: row.account,
          user: row.user,
          reference: row.orderId ? `Order #${row.orderId}` : null,
        }),
      );
    }

    for (const row of expenses) {
      entries.push(
        buildEntry({
          id: row.id,
          source: "expense",
          category: "expense",
          direction: "out",
          amount: row.amount,
          entryDate: row.paymentDate || row.createdAt,
          remarks: row.remarks,
          account: row.account,
          user: row.user,
        }),
      );
    }

    for (const row of purchases) {
      entries.push(
        buildEntry({
          id: row.id,
          source: "purchase",
          category: "purchase",
          direction: "out",
          amount: row.totalAmount,
          entryDate: row.paymentDate || row.createdAt,
          remarks: row.notes,
          account: row.account,
          user: row.enteredByUser,
          reference: row.invoiceNumber
            ? `Invoice ${row.invoiceNumber}`
            : null,
        }),
      );
    }

    for (const row of transactions) {
      entries.push(
        buildEntry({
          id: row.id,
          source: "transaction",
          category: row.type === "deposit" ? "deposit" : "withdraw",
          direction: row.type === "deposit" ? "in" : "out",
          amount: row.amount,
          entryDate: row.transactionDate,
          remarks: row.remarks,
          account: row.account,
          user: row.user,
        }),
      );
    }

    for (const row of transfers) {
      const pushTransferSide = (direction, account, counterparty) => {
        if (parsedAccountId && account?.id !== parsedAccountId) return;
        entries.push(
          buildEntry({
            id: row.id,
            source: "transfer",
            category: "transfer",
            direction,
            amount: row.amount,
            entryDate: row.transferDate,
            remarks: row.remarks,
            account,
            counterpartyAccount: counterparty,
            user: row.user,
            reference:
              direction === "out"
                ? `To ${counterparty?.name || "account"}`
                : `From ${counterparty?.name || "account"}`,
          }),
        );
      };

      pushTransferSide("out", row.fromAccount, row.toAccount);
      pushTransferSide("in", row.toAccount, row.fromAccount);
    }

    const filtered = entries
      .filter((entry) => matchesDirection(entry, direction))
      .filter((entry) => matchesCategory(entry, category))
      .filter((entry) => matchesAccountType(entry, accountType))
      .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / size), 1);
    const offset = (pageNum - 1) * size;
    const data = filtered.slice(offset, offset + size);

    const totals = filtered.reduce(
      (acc, entry) => {
        if (entry.direction === "in") acc.moneyIn += entry.amount;
        if (entry.direction === "out") acc.moneyOut += entry.amount;
        return acc;
      },
      { moneyIn: 0, moneyOut: 0 },
    );

    return {
      status: 200,
      success: true,
      message: "Ledger list successful",
      data: {
        data,
        total,
        page: pageNum,
        limit: size,
        totalPages,
        summary: {
          moneyIn: totals.moneyIn,
          moneyOut: totals.moneyOut,
          net: totals.moneyIn - totals.moneyOut,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  list,
};
