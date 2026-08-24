const isInRedeem = (redeemItems, id) => {
  const res = redeemItems.find((red) => red.productId === id);
  return res === undefined ? false : true;
};

module.exports = { isInRedeem };
