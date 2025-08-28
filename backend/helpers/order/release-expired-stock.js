const { productModel, cartModel, cartItemModel } = require("../../models");
const { Op } = require("sequelize");
// const redis = require("../../configs/redis");

// Helper: Release expired stock from carts
const releaseExpiredStock = async (transaction) => {
  const expiredCarts = await cartModel.findAll({
    where: { expiresAt: { [Op.lt]: new Date() } },
    include: [{ model: cartItemModel, as: "items" }],
    transaction,
  });

  for (const cart of expiredCarts) {
    for (const item of cart.items) {
      const product = await productModel.findByPk(item.productId, {
        transaction,
      });
      if (product && product.reservedQuantity > 0) {
        const newReserved = Math.max(
          product.reservedQuantity - item.quantity,
          0,
        );
        await product.update(
          { reservedQuantity: newReserved },
          { transaction },
        );
        await redis.del(`product:${item.productId}:reserved`);
      }
    }
    await cart.update({ expiresAt: null }, { transaction });
  }
};

module.exports = { releaseExpiredStock };
