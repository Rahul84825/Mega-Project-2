/**
 * shared/utils/pricing.js
 * 
 * CENTRALIZED PRICING ENGINE
 * 
 * SINGLE SOURCE OF TRUTH for all pricing, totals, and delivery calculations.
 * Used by Backend, Frontend, Cart, Checkout, Admin, and Emails.
 * 
 * BUSINESS RULE: GST is ALREADY INCLUDED in the admin product pricing.
 * DO NOT double-add GST. All prices are final selling prices.
 */

const normalizeNumber = (val, fallback = 0) => {
  const parsed = Number(val);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

// --- CORE FORMATTING ---

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(normalizeNumber(amount));
};

export const TAX_MESSAGE = "Inclusive of all taxes";

// --- VARIANT PRICING ---

/**
 * Calculates the selling price given MRP and discount.
 * Ensures the result is a whole number.
 */
export const calculateSellingPrice = (mrp, discountPercent) => {
  const safeMrp = Math.round(normalizeNumber(mrp));
  const safeDiscount = Math.min(100, normalizeNumber(discountPercent));
  return Math.round(safeMrp - (safeMrp * safeDiscount) / 100);
};

// --- CART & ORDER TOTALS ---

const DELIVERY_THRESHOLD = 500;
const DELIVERY_CHARGE = 40;

/**
 * Calculates totals for a given array of items.
 * Items must have: { price: number, quantity: number, gstRate: number }
 * 
 * @param {Array} items - The items in the cart or order.
 * @param {Number} manualDiscount - Any extra discount applied (e.g. coupon).
 * @param {Number} manualShipping - Override shipping fee (if not auto-calculated).
 * @returns {Object} { itemsSubtotal, shippingFee, discountTotal, grandTotal, gstTotal }
 */
export const calculateTotals = (items = [], manualDiscount = 0, manualShipping = null) => {
  if (!Array.isArray(items)) return { itemsSubtotal: 0, shippingFee: 0, discountTotal: 0, grandTotal: 0, gstTotal: 0, netSubtotal: 0 };

  let itemsSubtotal = 0; // Inclusive of GST
  let gstTotal = 0;

  items.forEach((item) => {
    const price = normalizeNumber(item?.price || item?.sellingPrice || item?.sellingPriceAtPurchase || 0);
    const qty = normalizeNumber(item?.quantity || 1);
    const rate = normalizeNumber(item?.gstRate || item?.gstPercent || 0);
    
    const lineTotal = price * qty;
    itemsSubtotal += lineTotal;

    // Calculate inclusive GST
    // Formula: GST Amount = Total - (Total / (1 + Rate/100))
    if (rate > 0) {
      const lineGst = lineTotal - (lineTotal / (1 + rate / 100));
      gstTotal += lineGst;
    }
  });

  const netSubtotal = itemsSubtotal - gstTotal;
  const discountTotal = normalizeNumber(manualDiscount);
  
  // Calculate delivery fee
  let shippingFee = 0;
  if (itemsSubtotal > 0) {
    if (manualShipping !== null && manualShipping !== undefined) {
      shippingFee = normalizeNumber(manualShipping);
    } else {
      shippingFee = itemsSubtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    }
  }

  // Calculate final total
  // itemsSubtotal already includes GST, so grandTotal = itemsSubtotal + shippingFee - discountTotal
  const grandTotal = Math.max(0, itemsSubtotal + shippingFee - discountTotal);

  return {
    itemsSubtotal: Math.round(itemsSubtotal), // Inclusive
    netSubtotal: Math.round(netSubtotal),     // Exclusive of GST
    shippingFee: Math.round(shippingFee),
    discountTotal: Math.round(discountTotal),
    gstTotal: Math.round(gstTotal), 
    grandTotal: Math.round(grandTotal),
    
    // Frontend aliases
    subtotal: Math.round(itemsSubtotal),
    deliveryFee: Math.round(shippingFee),
    total: Math.round(grandTotal),

    isFreeDelivery: shippingFee === 0 && itemsSubtotal > 0,
    deliveryThreshold: DELIVERY_THRESHOLD
  };
};

/**
 * Extracts a unified pricing snapshot for a specific variant.
 * Used when saving item snapshots to orders.
 */
export const getVariantPricingSnapshot = (product, variant) => {
  if (!product) return null;
  
  const isVariant = !!variant;
  const target = isVariant ? variant : product;
  
  const mrp = Math.round(normalizeNumber(target.mrp));
  const discountPercent = normalizeNumber(target.discountPercent);
  const sellingPrice = isVariant ? calculateSellingPrice(mrp, discountPercent) : Math.round(normalizeNumber(target.basePrice || target.price));

  return {
    mrp,
    discountPercent,
    sellingPrice,
    finalPrice: sellingPrice // Re-affirming that sellingPrice IS the final price (inclusive of taxes)
  };
};
