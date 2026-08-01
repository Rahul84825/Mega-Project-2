/**
 * Legacy Pricing Engine wrapper for Mithai World
 * Delegated to shared/utils/pricing.js (Single Source of Truth)
 */

import { calculateTotals as sharedCalculateTotals, formatCurrency as sharedFormatCurrency, TAX_MESSAGE as sharedTaxMessage } from "shared/utils/pricing";

export const calculateTotals = (items = [], options = {}) => {
  const result = sharedCalculateTotals(items, options);
  return {
    subtotal: result.netSubtotal,
    deliveryFee: result.shippingFee,
    total: result.grandTotal
  };
};

export const formatCurrency = sharedFormatCurrency;
export const TAX_MESSAGE = sharedTaxMessage;
