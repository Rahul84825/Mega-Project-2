/**
 * Centralized Pricing Engine for Mithai World
 * BUSINESS RULE: All prices stored in DB already include GST.
 * DO NOT add GST again.
 */

export const DELIVERY_FREE_THRESHOLD = 999;
export const DELIVERY_FEE = 60;

/**
 * Calculate order totals from cart items
 * @param {Array} items - Cart items with price and quantity
 * @returns {Object} { subtotal, deliveryFee, total }
 */
export const calculateTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => {
    // If it's an admin order item or cart item
    const itemSubtotal = item.subtotal || item.finalAmount;
    if (itemSubtotal) return sum + itemSubtotal;
    
    const price = Number(item?.sellingPriceAtPurchase || item?.finalPrice || item?.sellingPrice || item?.price || 0);
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
  if (!Number.isFinite(Number(amount))) return "₹0";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

export const formatPrice = formatCurrency; // Alias

/**
 * Get display message for taxes
 */
export const TAX_MESSAGE = "Inclusive of all taxes";

/**
 * Get delivery fee amount for given subtotal
 * @param {number} subtotal - Cart subtotal
 * @returns {number} Delivery fee amount
 */
export const getDeliveryFee = (subtotal) => {
  const amount = Number(subtotal) || 0;
  return amount >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;
};

/**
 * Calculate how much more is needed for free delivery
 * @param {number} subtotal - Cart subtotal
 * @returns {number} Amount needed for free delivery (0 if already free)
 */
export const amountForFreeDelivery = (subtotal) => {
  const amount = Number(subtotal) || 0;
  return amount >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FREE_THRESHOLD - amount;
};
