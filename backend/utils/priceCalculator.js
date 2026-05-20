/**
 * Centralized Pricing Engine for Mithai World Backend
 * BUSINESS RULE: All prices stored in DB already include GST.
 * DO NOT add GST again.
 */

const DELIVERY_FREE_THRESHOLD = 999;
const DELIVERY_FEE = 60;

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Extract item pricing based on inclusive selling price
 */
export const calculateItemSnapshotPricing = (product, variant, quantity) => {
  const mrpAtPurchase = Number(variant?.mrp ?? 0);
  const sellingPriceAtPurchase = Number(variant?.finalPrice ?? variant?.sellingPrice ?? 0);
  const gstRate = Number(product?.gstPercent ?? 0);
  
  const subtotal = roundMoney(sellingPriceAtPurchase * quantity);
  
  // Back-calculate GST amount from the inclusive price
  const priceWithoutGst = sellingPriceAtPurchase / (1 + gstRate / 100);
  const gstAmountPerItem = sellingPriceAtPurchase - priceWithoutGst;
  const gstAmount = roundMoney(gstAmountPerItem * quantity);
  
  const finalAmount = subtotal; 

  return {
    mrpAtPurchase,
    sellingPriceAtPurchase,
    gstRate,
    gstAmount,
    subtotal,
    finalAmount
  };
};

/**
 * Calculate order totals from item snapshots
 */
export const calculateOrderTotals = (itemSnapshots, discountTotal = 0, shippingFee = null, roundingAdjustment = 0) => {
  const itemsSubtotal = roundMoney(itemSnapshots.reduce((sum, item) => sum + item.subtotal, 0));
  const gstTotal = roundMoney(itemSnapshots.reduce((sum, item) => sum + item.gstAmount, 0));
  const safeDiscount = roundMoney(Number(discountTotal || 0));
  
  // If shippingFee is not provided, calculate it automatically
  let safeShipping = 0;
  if (shippingFee !== null && shippingFee !== undefined) {
    safeShipping = roundMoney(Number(shippingFee || 0));
  } else {
    safeShipping = itemsSubtotal >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
  }
  
  const safeRounding = roundMoney(Number(roundingAdjustment || 0));
  const grandTotal = roundMoney(itemsSubtotal + safeShipping - safeDiscount + safeRounding);

  return {
    itemsSubtotal,
    gstTotal,
    discountTotal: safeDiscount,
    shippingFee: safeShipping,
    roundingAdjustment: safeRounding,
    grandTotal
  };
};
