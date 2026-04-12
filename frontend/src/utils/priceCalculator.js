export const calculateFinalPrice = (originalPrice, discountPercent) => {
  const price = Number(originalPrice) || 0;
  const discount = Number(discountPercent) || 0;
  const safeDiscount = Math.max(0, Math.min(discount, 100));
  const final = price - (price * safeDiscount) / 100;
  return Math.round((final + Number.EPSILON) * 100) / 100;
};

export const formatPrice = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  });
};
