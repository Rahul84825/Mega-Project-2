/**
 * Legacy frontend pricing calculation utility
 * Delegated to shared/utils/pricing.js (Single Source of Truth)
 */

import { calculateTotals, formatCurrency } from "shared/utils/pricing";

export const calculateCartTotals = (cartItems = [], options = {}) => {
  const result = calculateTotals(cartItems, options);
  return {
    subtotal: result.netSubtotal,
    deliveryFee: result.shippingFee,
    gst: result.gstTotal,
    total: result.grandTotal
  };
};

export const getDeliveryFee = (subtotal, pincode = "") => {
  const result = calculateTotals([], { pincode });
  return result.shippingFee;
};

export const amountForFreeDelivery = (subtotal, pincode = "") => {
  const result = calculateTotals([], { pincode });
  const threshold = result.deliveryThreshold || 199;
  return Math.max(0, threshold - Number(subtotal || 0));
};

export const formatPricing = (totals) => {
  return {
    subtotal: formatCurrency(totals.subtotal),
    deliveryFee: totals.deliveryFee === 0 ? 'FREE' : formatCurrency(totals.deliveryFee),
    gst: formatCurrency(totals.gst),
    total: formatCurrency(totals.total)
  };
};
