// const calculateServiceCharge = (totalPaidAmount) => {
//   const max = 2.99;
//   const min = 0.99;
//   const percent = 11;
//   let serviceFee = 0;
//   calculateFee = (totalPaidAmount * percent) / 100;
//   if (calculateFee > 2.99) {
//     serviceFee = max;
//   } else if (serviceFee < 0.99) {
//     calculateFee = min;
//   } else {
//     serviceFee = calculateFee;
//   }
//   console.log(serviceFee);
//   return serviceFee * 100;
// };
// module.exports = { calculateServiceCharge };

/**
 * Calculates the service charge based on total paid amount
 * @param {number} totalPaidAmount - Total paid amount in pence
 * @returns {number} Service charge in pence, between 99 and 299, exact 11% if within bounds
 * @throws {Error} If totalPaidAmount is invalid
 */
const calculateServiceCharge = (totalPaidAmount) => {
  const SERVICE_CHARGE_MIN = 99; // 0.99 * 100, in pence
  const SERVICE_CHARGE_MAX = 299; // 2.99 * 100, in pence
  const SERVICE_CHARGE_PERCENTAGE = 0.11; // 11%

  // Input validation
  if (!Number.isFinite(totalPaidAmount) || totalPaidAmount < 0) {
    throw new Error("Invalid total paid amount: must be a non-negative number");
  }

  // Calculate exact 11% of total paid amount
  const calculatedFee = totalPaidAmount * SERVICE_CHARGE_PERCENTAGE;

  // Clamp between min and max, then round to nearest pence for Stripe
  return Math.round(
    Math.max(SERVICE_CHARGE_MIN, Math.min(SERVICE_CHARGE_MAX, calculatedFee)),
  );
};

module.exports = { calculateServiceCharge };
