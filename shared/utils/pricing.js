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

// Mock distance mapping from BASE_PINCODE to other Pune pincodes (for demo purposes)
const PINCODE_DISTANCES = {
  "411014": 0,    // Viman Nagar

  // Nearby Areas (1–5km)
  "411006": 3,    // Yerwada / Kalyani Nagar
  "411032": 4,    // Yerwada
  "411047": 2,    // Lohegaon
  "411015": 2,    // Vishrantwadi
  "411032": 4,    // Dhanori
  "411036": 5,    // Kalyani Nagar
  "411001": 5,    // Camp / MG Road
  "411027": 5,    // Pimple Saudagar
  "411048": 5,    // NIBM
  "411013": 5,    // Hadapsar

  // Standard Distance (6–10km)
  "411011": 7,    // Kasba Peth
  "411017": 8,    // Pimpri
  "411018": 9,    // Chinchwad
  "411028": 8,    // Hadapsar / Magarpatta
  "411040": 8,    // Wanowrie
  "411042": 8,    // Swargate
  "411016": 9,    // Shivajinagar
  "411020": 9,    // Aundh
  "411021": 10,   // Pashan
  "411004": 9,    // Deccan
  "411005": 8,    // Shivajinagar
  "411037": 9,    // Bibwewadi
  "411022": 10,   // Bavdhan
  "411026": 10,   // Nigdi
  "411039": 10,   // Bhosari
  "411045": 10,   // Baner

  // Medium/Far Distance (11–15km)
  "411002": 11,   // Swargate
  "411030": 11,   // Sinhagad Road
  "411033": 12,   // Akurdi
  "411035": 13,   // Chinchwad
  "411038": 13,   // Kothrud
  "411041": 14,   // Dhayari
  "411043": 14,   // Dhankawadi
  "411046": 15,   // Ambegaon
  "411051": 14,   // Anand Nagar
  "411052": 15,   // Karve Nagar
  "411058": 15,   // Warje
  "411019": 14,   // Chinchwad
  "411044": 15,   // Talegaon

  // Last Reach Areas (16–20km)
  "411023": 16,   // NDA / Sinhagad side
  "411024": 17,   // Khadakwasla
  "411057": 18,   // Hinjewadi
  "411061": 17,   // Pimple Gurav
  "411062": 18,   // Thergaon
  "411060": 19,   // Kondhwa
  "411059": 18,   // Wakad
  "412105": 20,   // Chakan
  "412307": 19,   // Wagholi
  "412308": 20,   // Manjari
  "412101": 20,   // Talegaon Dabhade

  // Out of Reach (>20km)
  "412114": 22,   // Dehu Road
  "412115": 24,   // Pirangut
  "412109": 25,   // Moshi
  "412106": 26,   // Alandi
  "412110": 27,   // Rajgurunagar
  "412216": 28,   // Narhe outskirts
  "412205": 30    // Rural Pune belt
};

/**
 * Rules for free delivery based on distance/pincode
 * - Same Pincode (411014): Free above ₹200
 * - Distance > 5km: Free above ₹500
 * - Distance > 10km: Free above ₹1000
 * - Distance > 15km: Last Orders Reach (Free above ₹1500)
 * - Distance > 20km: OUT OF REACH (Contact Us)
 */
export const getDeliveryConfig = (pincode = "", distance = null) => {
  const code = String(pincode).trim();
  
  // 1. Same Pincode check
  if (code === BASE_PINCODE) {
    return { threshold: 200, charge: DEFAULT_DELIVERY_CHARGE, label: "Same Pincode (Viman Nagar)", outOfReach: false };
  }

  // 2. Use distance if provided or found in mapping
  const effectiveDistance = distance !== null ? distance : (PINCODE_DISTANCES[code] || null);

  if (effectiveDistance !== null) {
    if (effectiveDistance > 20) {
      return { 
        threshold: Infinity, 
        charge: 0, 
        label: "Out of Reach (Contact Us)", 
        outOfReach: true 
      };
    }
    
    if (effectiveDistance > 15) {
      return { 
        threshold: 1500, 
        charge: DEFAULT_DELIVERY_CHARGE, 
        label: `Last Orders Reach (${effectiveDistance}km)`, 
        outOfReach: false 
      };
    }

    if (effectiveDistance > 10) return { threshold: 1000, charge: DEFAULT_DELIVERY_CHARGE, label: `Medium Distance (${effectiveDistance}km)`, outOfReach: false };
    if (effectiveDistance > 5) return { threshold: 500, charge: DEFAULT_DELIVERY_CHARGE, label: `Standard Distance (${effectiveDistance}km)`, outOfReach: false };
    
    // Within 5km but different pincode
    return { threshold: 500, charge: DEFAULT_DELIVERY_CHARGE, label: `Local Delivery (${effectiveDistance}km)`, outOfReach: false };
  }

  // 3. Fallback / Unknown distance (Default to standard but not blocked)
  return { threshold: 500, charge: DEFAULT_DELIVERY_CHARGE, label: "Standard Delivery", outOfReach: false };
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
    if (coupon.discountType === "PERCENTAGE") {
      couponDiscount = (netSubtotal * normalizeNumber(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) {
        couponDiscount = Math.min(couponDiscount, normalizeNumber(coupon.maxDiscount));
      }
    } else {
      couponDiscount = normalizeNumber(coupon.discountValue);
    }
  }

  const discountTotal = normalizeNumber(manualDiscount) + couponDiscount;
  
  // Dynamic Delivery Logic
  const deliveryConfig = getDeliveryConfig(pincode, distance);
  const DELIVERY_THRESHOLD = deliveryConfig.threshold;
  const DELIVERY_CHARGE = deliveryConfig.charge;

  let shippingFee = 0;
  if (netSubtotal > 0) {
    if (manualShipping !== null && manualShipping !== undefined) {
      shippingFee = normalizeNumber(manualShipping);
    } else {
      shippingFee = netSubtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    }
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
