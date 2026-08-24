const { cartModel } = require("../../models");
const { RESERVATION_TTL } = require("../../constants/time-constant");
const getOrCreateCart = async (userId, transaction) => {
  let cart = await cartModel.findOne({ where: { userId }, transaction });
  if (!cart) {
    cart = await cartModel.create(
      { userId, expiresAt: new Date(Date.now() + RESERVATION_TTL) },
      { transaction },
    );
  }
  return cart;
};

module.exports = { getOrCreateCart };
