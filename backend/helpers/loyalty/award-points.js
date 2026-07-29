const { Sequelize } = require("sequelize");
const { customerModel } = require("../../models");

/** Rs. required per 1 loyalty point */
const LOYALTY_RUPEES_PER_POINT = 100;

/**
 * Loyalty points = floor(amount / 100).
 * Amounts under 100 earn 0 points.
 * @param {number|string} amount
 * @returns {number}
 */
const calculateLoyaltyPoints = (amount) => {
  const paid = Number(amount);
  if (!Number.isFinite(paid) || paid < LOYALTY_RUPEES_PER_POINT) return 0;
  return Math.floor(paid / LOYALTY_RUPEES_PER_POINT);
};

/**
 * Atomically add loyalty points for a customer based on paid amount.
 * @returns {Promise<number>} points added
 */
const awardLoyaltyPoints = async ({
  customerId,
  amount,
  transaction,
  isGuestOrder = false,
}) => {
  if (isGuestOrder || !customerId) return 0;

  const points = calculateLoyaltyPoints(amount);
  if (points <= 0) return 0;

  await customerModel.update(
    {
      loyaltyPoints: Sequelize.literal(`loyaltyPoints + ${points}`),
    },
    {
      where: { id: customerId },
      transaction,
    },
  );

  return points;
};

module.exports = {
  LOYALTY_RUPEES_PER_POINT,
  calculateLoyaltyPoints,
  awardLoyaltyPoints,
};
