/**
 * Centralized pricing calculation utility
 * Used across: Cart, Checkout, Order creation, Admin display
 * Ensures consistent pricing throughout the application
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
 * Get delivery fee amount for given subtotal
 * @param {number} subtotal - Cart subtotal
 * @returns {number} Delivery fee amount
 */
export const getDeliveryFee = (subtotal) => {
  const amount = Number(subtotal) || 0;
  return amount > DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
};

/**
 * Calculate how much more is needed for free delivery
 * @param {number} subtotal - Cart subtotal
 * @returns {number} Amount needed for free delivery (0 if already free)
 */
export const amountForFreeDelivery = (subtotal) => {
  const amount = Number(subtotal) || 0;
  return amount > DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FREE_THRESHOLD - amount;
};

/**
 * Format pricing for display
 * @param {Object} totals - Result from calculateCartTotals
 * @returns {Object} Formatted pricing strings
 */
export const formatPricing = (totals) => {
  return {
    subtotal: `₹${totals.subtotal.toFixed(2)}`,
    deliveryFee: totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`,
    gst: `₹${totals.gst.toFixed(2)}`,
    total: `₹${totals.total.toFixed(2)}`
  };
};
