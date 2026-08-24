const deliveryCharge = (totalPaidAmount) => {
  console.log(totalPaidAmount / 100, "ttttttttttttttttttt");
  const x = totalPaidAmount / 100 > 10 ? 0.99 : 2.99;
  console.log(x);
  return x * 100;
};
module.exports = { deliveryCharge };
