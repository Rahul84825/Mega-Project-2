export const calculateFinalPrice = (originalPrice, discountPercent) => {
  const price = Number(originalPrice) || 0;
  const discount = Number(discountPercent) || 0;
  const safeDiscount = Math.max(0, Math.min(discount, 100));
  const final = price - (price * safeDiscount) / 100;
  return Math.max(0, Math.round(final));
};

export const calculateSellingPriceFromDiscount = (mrp, discountPercent) => {
  const price = Number(mrp) || 0;
  const discount = Number(discountPercent) || 0;
  const safeDiscount = Math.max(0, Math.min(discount, 100));
  const sellingPrice = price - (price * safeDiscount) / 100;
  return Math.max(0, Math.round(sellingPrice));
};

export const calculatePriceWithGST = (basePrice, gstPercent) => {
  const price = Number(basePrice) || 0;
  const gst = Number(gstPercent) || 0;
  const safeGst = Math.max(0, Math.min(gst, 100));
  return Math.max(0, Math.round(price + (price * safeGst) / 100));
};

export const calculateDiscount = (mrp, sellingPrice) => {
  const malePrice = Math.max(0, Number(mrp) || 0);
  const sPrice = Math.max(0, Number(sellingPrice) || 0);
  return Math.max(0, malePrice - sPrice);
};

export const calculateFinalPriceWithGST = (sellingPrice, gstPercent) => {
  const price = Number(sellingPrice) || 0;
  const gst = Number(gstPercent) || 0;
  const safeGst = Math.max(0, Math.min(gst, 100));
  return Math.max(0, Math.round(price + (price * safeGst) / 100));
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
