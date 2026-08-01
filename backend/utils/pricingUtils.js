/**
 * Legacy Backend pricing calculation utility
 * Delegated to shared/utils/pricing.js (Single Source of Truth)
 */

import { calculateTotals } from "../../shared/utils/pricing.js";

export const calculateCartTotals = (cartItems = [], options = {}) => {
  const result = calculateTotals(cartItems, options);
  return {
    subtotal: result.netSubtotal,
    deliveryFee: result.shippingFee,
    gst: result.gstTotal,
    total: result.grandTotal
  };
};

export const validatePricingTotals = (providedTotals = {}, cartItems = [], options = {}) => {
  const calculated = calculateCartTotals(cartItems, options);
  
  const provided = {
    subtotal: Math.round(Number(providedTotals?.subtotal || providedTotals?.itemsSubtotal || 0)),
    deliveryFee: Math.round(Number(providedTotals?.deliveryFee || providedTotals?.shippingFee || 0)),
    gst: Math.round(Number(providedTotals?.gst || providedTotals?.gstTotal || 0)),
    total: Math.round(Number(providedTotals?.total || providedTotals?.grandTotal || 0))
  };

  const tolerance = 1; // 1 INR tolerance for rounding
  const isValid = 
    Math.abs(calculated.subtotal - provided.subtotal) <= tolerance &&
    Math.abs(calculated.deliveryFee - provided.deliveryFee) <= tolerance &&
    Math.abs(calculated.gst - provided.gst) <= tolerance &&
    Math.abs(calculated.total - provided.total) <= tolerance;

  return { isValid, calculated, provided };
};
