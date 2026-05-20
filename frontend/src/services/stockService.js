import api from "./api";

/**
 * Get stock information for products and variants
 * @param {Array} productIds - Array of product IDs
 * @param {Array} variantIds - Array of variant IDs (optional)
 * @returns {Promise<Array>} Array of stock information
 */
export const getStockInfo = async (productIds = [], variantIds = []) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (productIds.length > 0) {
      queryParams.append("productIds", productIds.join(","));
    }
    
    if (variantIds.length > 0) {
      queryParams.append("variantIds", variantIds.join(","));
    }

    if (!productIds.length && !variantIds.length) {
      return [];
    }

    const response = await api.get(`/api/products/stock/info?${queryParams.toString()}`);
    return response?.stock || [];
  } catch (error) {
    console.error("Error fetching stock info:", error);
    return [];
  }
};

/**
 * Check if a product has stock
 * @param {number|string} stock - Stock quantity
 * @returns {boolean} True if stock is available
 */
export const isInStock = (stock) => {
  return Number(stock || 0) > 0;
};

/**
 * Get stock status message
 * @param {number|string} stock - Stock quantity
 * @param {number} requestedQty - Requested quantity (optional)
 * @returns {string} Stock status message
 */
export const getStockStatus = (stock, requestedQty = 1) => {
  const stockNum = Number(stock || 0);
  
  if (stockNum <= 0) {
    return "Out of Stock";
  }
  
  if (stockNum === 1) {
    return "Only 1 left";
  }
  
  if (stockNum <= 5) {
    return `Only ${stockNum} left`;
  }
  
  if (stockNum < requestedQty) {
    return `Only ${stockNum} available`;
  }
  
  return "In Stock";
};

/**
 * Get stock color/badge style
 * @param {number|string} stock - Stock quantity
 * @returns {Object} Color configuration {bg, text, border}
 */
export const getStockColorClass = (stock) => {
  const stockNum = Number(stock || 0);
  
  if (stockNum <= 0) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  
  if (stockNum <= 5) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  
  return "bg-green-50 text-green-700 border-green-200";
};

/**
 * Batch check stock for multiple products
 * @param {Array} cartItems - Items with productId and quantity
 * @returns {Promise<Object>} Map of productId -> stock info
 */
export const checkCartStock = async (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return {};
  }

  const productIds = cartItems
    .map(item => item.productId)
    .filter(Boolean);

  const stockData = await getStockInfo(productIds);
  
  const stockMap = {};
  for (const stock of stockData) {
    stockMap[stock.productId] = stock;
  }
  
  return stockMap;
};
