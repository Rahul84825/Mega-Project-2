export const calculateFinalPrice = (originalPrice, discountPercent) => {
  const price = Number(originalPrice) || 0;
  const discount = Number(discountPercent) || 0;
  const safeDiscount = Math.max(0, Math.min(discount, 100));
  const final = price - (price * safeDiscount) / 100;
  return Math.max(0, Math.round(final));
};

export const formatPrice = (value) => {
  const amount = Math.max(0, Math.round(Number(value) || 0));
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};
