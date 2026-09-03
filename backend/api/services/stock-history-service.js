const { Op } = require("sequelize");
const {
  stockHistoryModel,
  stockItemModel,
  measuringUnitModel,
  userModel,
} = require("../../models");
const generalConstant = require("../../constants/general-constant");
const paginate = require("../../utils/paginate");

/** Parse yyyy-MM-dd as local calendar day start (avoids UTC off-by-one). */
function dayStart(isoDate) {
  const [y, m, d] = String(isoDate).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayEnd(isoDate) {
  const [y, m, d] = String(isoDate).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

const list = async (req) => {
  try {
    const { limit, page, stockItemId, type, from, to } = req.query;
    const filters = {};

    if (stockItemId) filters.stockItemId = +stockItemId;
    if (type) filters.type = type;
    if (from || to) {
      filters.createdAt = {};
      if (from) {
        const start = dayStart(from);
        if (start) filters.createdAt[Op.gte] = start;
      }
      if (to) {
        const end = dayEnd(to);
        if (end) filters.createdAt[Op.lte] = end;
      }
    }

    const result = await paginate(stockHistoryModel, {
      limit,
      page,
      filters,
      include: [
        {
          model: stockItemModel,
          as: "stockItem",
          attributes: ["id", "name"],
          include: [
            {
              model: measuringUnitModel,
              as: "measuringUnit",
              attributes: ["id", "symbol"],
            },
          ],
        },
        {
          model: userModel,
          as: "creator",
          attributes: ["id", "firstName", "lastName", "username"],
          required: false,
        },
      ],
      order: [
        ["createdAt", "DESC"],
        ["id", "DESC"],
      ],
    });

    return {
      ...generalConstant.EN.STOCK_HISTORY.LIST_SUCCESS,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { list };
