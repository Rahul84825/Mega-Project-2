/**
 * shared/utils/pricing.js
 * 
 * CENTRALIZED PRICING ENGINE
 * 
 * SINGLE SOURCE OF TRUTH for all pricing, totals, and delivery calculations.
 * Used by Backend, Frontend, Cart, Checkout, Admin, and Emails.
 * 
 * BUSINESS RULE: GST is added EXTRA on top of the selling price.
 * All prices entered in admin are net prices (before GST).
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

export const TAX_MESSAGE = "Exclusive of GST";

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

const DEFAULT_DELIVERY_CHARGE = 40;
const BASE_PINCODE = "411014";

// Strict Serviceable Pincodes Mapping
const SERVICEABLE_PINCODES = {
  // 0–5 km: FREE DELIVERY
  "411014": { threshold: 99, charge: 30, label: "Local Delivery (Viman Nagar)" },
  "411006": { threshold: 99, charge: 30, label: "Local Delivery (Yerwada)" },
  "411032": { threshold: 99, charge: 30, label: "Local Delivery (Dhanori)" },

  // 5–10 km: ₹60 (Free >= ₹499)
  "411047": { threshold: 499, charge: 60, label: "Standard Distance (Lohegaon)" },
  "411015": { threshold: 499, charge: 60, label: "Standard Distance (Vishrantwadi)" },
  "411036": { threshold: 499, charge: 60, label: "Standard Distance (Mundhwa)" },
  "411001": { threshold: 499, charge: 60, label: "Standard Distance (Camp)" },
  "412207": { threshold: 499, charge: 60, label: "Standard Distance (Wagholi)" },

  // 10–15 km: ₹80 (Free >= ₹899)
  "411005": { threshold: 899, charge: 80, label: "Medium Distance (Shivajinagar)" },
  "411028": { threshold: 899, charge: 80, label: "Medium Distance (Hadapsar)" },
  "412307": { threshold: 899, charge: 80, label: "Medium Distance (Manjari)" },
  "411040": { threshold: 899, charge: 80, label: "Medium Distance (Wanowrie)" },
  "411004": { threshold: 899, charge: 80, label: "Medium Distance (Deccan)" },
  "411011": { threshold: 899, charge: 80, label: "Medium Distance (Kasba Peth)" },
  "411002": { threshold: 899, charge: 80, label: "Medium Distance (Swargate)" },
  "411003": { threshold: 899, charge: 80, label: "Medium Distance (Raviwar Peth)" },
  "411007": { threshold: 899, charge: 80, label: "Medium Distance (Aundh)" }
};

/**
 * Rules for delivery eligibility and fees based on pincode or distance
 */
export const getDeliveryConfig = (pincode = "", distance = null) => {
  // 1. If distance is provided, use it (highest priority)
  if (distance !== null && distance !== undefined) {
    const dist = Number(distance);
    if (dist <= 5) {
      return { 
        threshold: 99, 
        charge: 30, 
        label: "Local Delivery (0–5 km)", 
        outOfReach: false 
      };
    }
    if (dist <= 10) {
      return { 
        threshold: 499, 
        charge: 60, 
        label: "Standard Distance (5–10 km)", 
        outOfReach: false 
      };
    }
    if (dist <= 15) {
      return { 
        threshold: 899, 
        charge: 80, 
        label: "Medium Distance (10–15 km)", 
        outOfReach: false 
      };
    }
    return { 
      threshold: Infinity, 
      charge: 0, 
      label: "Sorry, we only deliver within 15 km.", 
      outOfReach: true 
    };
  }

  // 2. Fallback to Pincode Mapping
  const code = String(pincode).trim();
  const config = SERVICEABLE_PINCODES[code];

  if (!config) {
    return { 
      threshold: Infinity, 
      charge: 0, 
      label: "Sorry, we currently do not deliver to this location.", 
      outOfReach: true 
    };
  }

  return { 
    threshold: config.threshold, 
    charge: config.charge, 
    label: config.label, 
    outOfReach: false 
  };
};

/**
 * Calculates totals for a given array of items.
 * Items must have: { price: number, quantity: number, gstRate: number }
 * 
 * @param {Array} items - The items in the cart or order.
 * @param {Object} options - { coupon, manualDiscount, manualShipping, pincode, distance }
 * @returns {Object} { itemsSubtotal, shippingFee, discountTotal, grandTotal, gstTotal, netSubtotal }
 */
export const calculateTotals = (items = [], options = {}) => {
  const { coupon = null, manualDiscount = 0, manualShipping = null, pincode = "", distance = null } = options;
  
  if (!Array.isArray(items)) return { itemsSubtotal: 0, shippingFee: 0, discountTotal: 0, grandTotal: 0, gstTotal: 0, packingTotal: 0, netSubtotal: 0 };

  let netSubtotal = 0; // Sum of selling prices (Before GST)
  let gstTotal = 0;
  let packingTotal = 0;

  items.forEach((item) => {
    const price = normalizeNumber(item?.price || item?.sellingPrice || item?.sellingPriceAtPurchase || 0);
    const qty = normalizeNumber(item?.quantity || 1);
    const rate = normalizeNumber(item?.gstRate || item?.gstPercent || 0);
    const packing = normalizeNumber(item?.packingCharges || 0);
    
    const lineNetTotal = price * qty;
    netSubtotal += lineNetTotal;
    packingTotal += (packing * qty);

    // Calculate exclusive GST (Added ON TOP)
    if (rate > 0) {
      const lineGst = (lineNetTotal * rate) / 100;
      gstTotal += lineGst;
    }
  });

  // Calculate Coupon Discount
  let couponDiscount = 0;
  if (coupon && netSubtotal > 0) {
    // Re-validate minimum order amount requirement dynamically
    const minAmount = normalizeNumber(coupon.minOrderAmount || 0);
    
    if (netSubtotal >= minAmount) {
      if (coupon.discountType === "PERCENTAGE") {
        couponDiscount = (netSubtotal * normalizeNumber(coupon.discountValue)) / 100;
        if (coupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, normalizeNumber(coupon.maxDiscount));
        }
      } else {
        couponDiscount = normalizeNumber(coupon.discountValue);
      }
    }
  }

  const discountTotal = normalizeNumber(manualDiscount) + couponDiscount;
  
  // Dynamic Delivery Logic
  const deliveryConfig = getDeliveryConfig(pincode, distance);
  const DELIVERY_THRESHOLD = deliveryConfig.threshold;
  
  // Determine base charge: prioritize manual override (e.g., from backend validation), fallback to config
  const DELIVERY_CHARGE = (manualShipping !== null && manualShipping !== undefined) 
    ? normalizeNumber(manualShipping) 
    : deliveryConfig.charge;

  let shippingFee = 0;
  if (netSubtotal > 0) {
    // BUSINESS RULE: Delivery fee is FREE if subtotal meets or exceeds threshold
    shippingFee = netSubtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  }

  // Calculate final total (Exclusive GST + Packing + Delivery)
  const grandTotal = Math.max(0, netSubtotal + gstTotal + packingTotal + shippingFee - discountTotal);

  return {
    netSubtotal: Math.round(netSubtotal),
    gstTotal: Math.round(gstTotal),
    packingTotal: Math.round(packingTotal),
    shippingFee: Math.round(shippingFee),
    couponDiscount: Math.round(couponDiscount),
    discountTotal: Math.round(discountTotal),
    grandTotal: Math.round(grandTotal),
    
    // Compatibility aliases
    subtotal: Math.round(netSubtotal),
    itemsSubtotal: Math.round(netSubtotal),
    deliveryFee: Math.round(shippingFee),
    total: Math.round(grandTotal),

    isFreeDelivery: shippingFee === 0 && netSubtotal > 0,
    deliveryThreshold: DELIVERY_THRESHOLD,
    deliveryLabel: deliveryConfig.label,
    outOfReach: deliveryConfig.outOfReach
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
    finalPrice: sellingPrice // Selling price is net price in exclusive model
  };
};
