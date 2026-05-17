/**
 * Backend pricing calculation utility
 * Ensures consistent pricing for order creation and validation
 */

const DELIVERY_FREE_THRESHOLD = 999;
const DELIVERY_FEE = 60;
const GST_RATE = 0.05; // 5% GST

/**
 * Calculate complete order totals from cart items
 * @param {Array} cartItems - Array of cart items with price and quantity
 * @returns {Object} Pricing breakdown: { subtotal, deliveryFee, gst, total }
 */
export const calculateCartTotals = (cartItems = []) => {
  // Subtotal: sum of (price × quantity) for all items
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = Number(item?.price) || 0;
    const itemQty = Number(item?.quantity) || 0;
    return sum + (itemPrice * itemQty);
  }, 0);

  // Delivery fee: FREE if subtotal > ₹999, else ₹60
  const deliveryFee = subtotal > DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;

  // GST: 5% on subtotal + delivery
  const gst = Math.round((subtotal + deliveryFee) * GST_RATE * 100) / 100;

  // Total: subtotal + delivery + GST
  const total = Math.round((subtotal + deliveryFee + gst) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    gst,
    total
  };
};

/**
 * Validate pricing totals against calculated values
 * @param {Object} providedTotals - Totals provided in request
 * @param {Array} cartItems - Cart items for recalculation
 * @returns {Object} { isValid: boolean, calculated: Object, provided: Object }
 */
export const validatePricingTotals = (providedTotals = {}, cartItems = []) => {
  const calculated = calculateCartTotals(cartItems);
  
  const provided = {
    subtotal: Math.round(Number(providedTotals?.subtotal || 0) * 100) / 100,
    deliveryFee: Math.round(Number(providedTotals?.deliveryFee || 0) * 100) / 100,
    gst: Math.round(Number(providedTotals?.gst || 0) * 100) / 100,
    total: Math.round(Number(providedTotals?.total || 0) * 100) / 100
  };

  // Allow small tolerance for rounding (within ±0.50 paise)
  const tolerance = 0.01;
  const isValid = 
    Math.abs(calculated.subtotal - provided.subtotal) <= tolerance &&
    Math.abs(calculated.deliveryFee - provided.deliveryFee) <= tolerance &&
    Math.abs(calculated.gst - provided.gst) <= tolerance &&
    Math.abs(calculated.total - provided.total) <= tolerance;

  return { isValid, calculated, provided };
};
