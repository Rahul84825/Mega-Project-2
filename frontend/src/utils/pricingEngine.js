/**
 * Centralized Pricing Engine for Mithai World
 * BUSINESS RULE: All prices stored in DB already include GST.
 * DO NOT add GST again.
 */

const DELIVERY_FREE_THRESHOLD = 999;
const DELIVERY_FEE = 60;

/**
 * Calculate order totals from cart items
 * @param {Array} items - Cart items with price and quantity
 * @returns {Object} { subtotal, deliveryFee, total }
 */
export const calculateTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item?.price || item?.sellingPrice || 0);
    const qty = Number(item?.quantity || 1);
    return sum + (price * qty);
  }, 0);

  const deliveryFee = (subtotal >= DELIVERY_FREE_THRESHOLD || subtotal === 0) ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return {
    subtotal: Math.round(subtotal),
    deliveryFee,
    total: Math.round(total)
  };
};

/**
 * Format number to Indian Currency (INR)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

/**
 * Get display message for taxes
 */
export const TAX_MESSAGE = "Inclusive of all taxes";
