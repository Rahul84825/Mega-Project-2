import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";
import { getIo } from "../socket.js";
import { getVariantPricingSnapshot, calculateTotals } from "../../shared/utils/pricing.js";

export class InventoryError extends Error {
  constructor(message, status = 400, code = "INVENTORY_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const getVariantSelection = (item) => {
  const variantIndex = Number.isInteger(Number(item?.variantIndex)) ? Number(item.variantIndex) : null;
  const variantLabel = String(item?.variant?.label || item?.variantLabel || "").trim();
  const variantId = String(item?.variantId || item?.variant?._id || item?.variant?.id || "").trim();
  return { variantIndex, variantLabel, variantId };
};

const resolveVariant = (product, item) => {
  const { variantIndex, variantLabel, variantId } = getVariantSelection(item);
  
  // Handle products without variants - they have a default "variant"
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) {
    // Products without variants are allowed - return a marker to indicate "no variant"
    return { variant: { _id: "no-variant", label: "Default", stock: product?.stock || 0 }, variantIndex: null, isSimpleProduct: true };
  }

  if (variantId && variantId !== "") {
    const foundIndex = product.variants.findIndex(
      (variant) => String(variant?._id || variant?.id || "").trim() === variantId
    );
    if (foundIndex >= 0) {
      return { variant: product.variants[foundIndex], variantIndex: foundIndex };
    }
  }

  if (variantIndex !== null && variantIndex >= 0) {
    return { variant: product.variants[variantIndex] || null, variantIndex };
  }

  if (variantLabel && variantLabel !== "") {
    const labelIndex = product.variants.findIndex(
      (variant) => String(variant?.label || "").trim() === variantLabel
    );
    if (labelIndex >= 0) {
      return { variant: product.variants[labelIndex], variantIndex: labelIndex };
    }
  }

  // If no variant found by any method, reject
  return { variant: null, variantIndex: null, isSimpleProduct: false };
};

export const reserveStock = async ({
  items,
  session,
  orderNumber,
  reason = "Order reservation",
  discountTotal = 0,
  shippingFee = null,
  pincode = "",
  distance = null,
  roundingAdjustment = 0
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new InventoryError("Order must include at least one item", 400, "EMPTY_ORDER");
  }

  const itemSnapshots = [];
  const logEntries = [];

  for (const item of items) {
    const productId = item?.productId || item?._id || item?.id;
    const quantity = Number(item?.quantity ?? item?.qty ?? 0);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      throw new InventoryError("Invalid order item payload", 400, "INVALID_ITEM");
    }

    const product = await Product.findById(productId)
      .select("name image gstPercent variants stock")
      .session(session);

    if (!product) {
      throw new InventoryError(`Product not found: ${productId}`, 404, "PRODUCT_NOT_FOUND");
    }

    const { variant, variantIndex, isSimpleProduct } = resolveVariant(product, item);

    // Improved error messages for debugging
    if (!variant) {
      const variantInfo = getVariantSelection(item);
      const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
      
      const errorDetails = {
        productName: product.name,
        variantId: variantInfo.variantId,
        variantLabel: variantInfo.variantLabel,
        variantIndex: variantInfo.variantIndex,
        hasVariants,
        availableVariants: hasVariants ? product.variants.map(v => ({ id: v._id, label: v.label })) : []
      };
      
      if (hasVariants) {
        throw new InventoryError(
          `Invalid variant selection for ${product.name}. Available variants: ${product.variants.map(v => v.label).join(", ")}`,
          400,
          "INVALID_VARIANT"
        );
      } else {
        throw new InventoryError(
          `${product.name} has no variants but variantId was provided`,
          400,
          "INVALID_VARIANT"
        );
      }
    }

    // Check for availability only - numeric stock is no longer used for checks
    const isAvailable = isSimpleProduct ? (product.isActive !== false) : (variant.isAvailable !== false);

    if (!isAvailable) {
      throw new InventoryError(
        `${product.name} (${variant.label || 'Default'}) is currently unavailable for purchase.`,
        409,
        "ITEM_UNAVAILABLE"
      );
    }

    // Skip numeric stock checks and updates
    /* 
    if (Number(stockAvailable) < quantity) {
      throw new InventoryError(
        `${product.name} is out of stock or has insufficient quantity (requested: ${quantity}, available: ${stockAvailable})`,
        409,
        "INSUFFICIENT_STOCK"
      );
    }
    */

    const pricing = getVariantPricingSnapshot(product, variant);
    const subtotal = pricing.sellingPrice * quantity;
    const gstRate = Number(product.gstPercent || 0);
    const gstAmount = (subtotal * gstRate) / 100;

    itemSnapshots.push({
      productId,
      titleSnapshot: product.name,
      imageSnapshot: product.image || item?.image || "",
      selectedVariant: {
        variantId: isSimpleProduct ? null : (variant?._id || null),
        label: variant?.label || "Default",
        weight: item?.weight || "",
        size: item?.size || ""
      },
      gstRate: gstRate,
      gstAmount: Math.round(gstAmount),
      mrpAtPurchase: pricing.mrp,
      sellingPriceAtPurchase: pricing.sellingPrice,
      quantity,
      subtotal: subtotal,
      finalAmount: subtotal + Math.round(gstAmount), // Exclusive model: Selling Price + GST
      stockSnapshot: {
        stockAtPurchase: isSimpleProduct ? (product.stock || 0) : (variant.stock || 0),
        warehouseId: item?.warehouseId || ""
      }
    });

    logEntries.push({
      productId,
      variantId: isSimpleProduct ? null : (variant?._id || null),
      variantLabel: variant?.label || "Default",
      action: "RESERVE",
      quantity,
      stockBefore: isSimpleProduct ? (product.stock || 0) : (variant.stock || 0),
      stockAfter: isSimpleProduct ? (product.stock || 0) : (variant.stock || 0),
      orderNumber,
      reason,
      metadata: { source: "checkout" }
    });
  }

  if (logEntries.length > 0) {
    await InventoryLog.insertMany(logEntries, { session });
  }

  // ✅ Emit socket events for real-time stock updates
  const io = getIo();
  if (io) {
    const affectedProductIds = [...new Set(itemSnapshots.map(item => item.productId))];
    for (const productId of affectedProductIds) {
      const updatedProduct = await Product.findById(productId);
      if (updatedProduct) {
        io.emit("stock:updated", {
          productId: updatedProduct._id,
          stock: updatedProduct.stock,
          variants: updatedProduct.variants
        });
      }
    }
  }

  const totals = calculateTotals(itemSnapshots, { 
    manualDiscount: discountTotal, 
    manualShipping: shippingFee, 
    pincode, 
    distance 
  });

  return {
    itemSnapshots,
    totals
  };
};

export const releaseStock = async ({ reservations, session, orderNumber, reason = "Reservation release" }) => {
  if (!Array.isArray(reservations) || reservations.length === 0) {
    return;
  }

  const logEntries = [];

  for (const reservation of reservations) {
    const { productId, variantIndex, quantity } = reservation;
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    // Skip actual stock update
    /*
    const variantPath = `variants.${variantIndex}.stock`;
    await Product.updateOne(
      { _id: productId },
      { $inc: { [variantPath]: quantity } },
      { session }
    );
    */

    const product = await Product.findById(productId)
      .select(`variants.${variantIndex}.stock variants.${variantIndex}.label`)
      .session(session);
    const currentStock = Number(product?.variants?.[variantIndex]?.stock ?? 0);

    logEntries.push({
      productId,
      variantId: product?.variants?.[variantIndex]?._id || null,
      variantLabel: product?.variants?.[variantIndex]?.label || "",
      action: "RELEASE",
      quantity,
      stockBefore: currentStock,
      stockAfter: currentStock,
      orderNumber,
      reason,
      metadata: { source: "release" }
    });
  }

  if (logEntries.length > 0) {
    await InventoryLog.insertMany(logEntries, { session });
  }
};

/**
 * Get current stock for a product or variant
 * @param {string} productId - Product ID
 * @param {string|number} variantId - Variant ID or index (optional)
 * @returns {Promise<{available: number, reserved: number, total: number}>}
 */
export const getProductStock = async (productId, variantId = null) => {
  const product = await Product.findById(productId).select("stock variants isActive");
  
  if (!product) {
    throw new InventoryError(`Product not found: ${productId}`, 404, "PRODUCT_NOT_FOUND");
  }

  const isProductActive = product.isActive !== false;

  // Simple product (no variants)
  if (!variantId && (!Array.isArray(product.variants) || product.variants.length === 0)) {
    return {
      productId,
      type: "simple",
      available: isProductActive ? 999 : 0,
      reserved: 0,
      total: isProductActive ? 999 : 0,
      isAvailable: isProductActive
    };
  }

  // Product with variants - find specific variant
  if (variantId) {
    const variantIndex = product.variants.findIndex(v => 
      String(v._id || v.id) === String(variantId)
    );

    if (variantIndex < 0) {
      throw new InventoryError(`Variant not found: ${variantId}`, 404, "VARIANT_NOT_FOUND");
    }

    const variant = product.variants[variantIndex];
    const isVariantAvailable = isProductActive && variant.isAvailable !== false;
    
    return {
      productId,
      variantId: variant._id,
      variantLabel: variant.label,
      type: "variant",
      available: isVariantAvailable ? 999 : 0,
      reserved: 0,
      total: isVariantAvailable ? 999 : 0,
      isAvailable: isVariantAvailable
    };
  }

  // Return all variants if no specific variant requested
  return {
    productId,
    type: "variants",
    variants: (product.variants || []).map(v => {
      const isVariantAvailable = isProductActive && v.isAvailable !== false;
      return {
        variantId: v._id,
        label: v.label,
        available: isVariantAvailable ? 999 : 0,
        total: isVariantAvailable ? 999 : 0,
        isAvailable: isVariantAvailable
      };
    })
  };
};

/**
 * Check if items are in stock before allowing purchase
 * @param {Array} items - Cart items with productId, variantId, quantity
 * @returns {Promise<{isValid: boolean, errors: Array}>}
 */
export const validateItemsStock = async (items) => {
  const errors = [];

  for (const item of items) {
    const productId = item?.productId || item?._id;
    const quantity = Number(item?.quantity ?? 0);

    if (!productId || quantity <= 0) {
      errors.push({
        productId,
        message: "Invalid item data"
      });
      continue;
    }

    try {
      const stockInfo = await getProductStock(productId, item?.variantId);
      
      if (stockInfo.available < quantity) {
        errors.push({
          productId,
          variantId: item?.variantId,
          requested: quantity,
          available: stockInfo.available,
          message: `Insufficient stock for ${item?.name || "product"}. Requested: ${quantity}, Available: ${stockInfo.available}`
        });
      }
    } catch (error) {
      errors.push({
        productId,
        message: error.message
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
 /* Supports both variant and simple products
 * @param {Object} options - Configuration object
 * @param {Array} options.items - Order items with productId, variantId/variantIndex, quantity
 * @param {Object} options.session - Mongoose session for transaction
 * @param {string} options.orderNumber - Order number for logging
 * @param {string} options.reason - Reason for stock restoration
 * @returns {Promise<void>}
 */
export const restoreStock = async ({ items, session, orderNumber, reason = "Stock restoration" }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  const logEntries = [];

  for (const item of items) {
    const productId = item?.productId || item?._id;
    const quantity = Number(item?.quantity ?? 0);
    
    if (!productId || quantity <= 0) {
      continue;
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      continue;
    }

    const { variant, variantIndex, isSimpleProduct } = resolveVariant(product, item);
    
    if (!variant) {
      continue; // Skip if variant not found
    }

    // Skip actual stock restoration
    /*
    if (isSimpleProduct) {
      const currentStock = Number(product.stock ?? 0);
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: quantity } },
        { session }
      );
      ...
    } else {
      ...
    }
    */

    const currentStock = isSimpleProduct ? Number(product.stock ?? 0) : Number(variant.stock ?? 0);

    logEntries.push({
      productId,
      variantId: isSimpleProduct ? null : (variant._id || null),
      variantLabel: variant.label || "Default",
      action: "RESTORE",
      quantity,
      stockBefore: currentStock,
      stockAfter: currentStock,
      orderNumber,
      reason,
      metadata: { source: "restore" }
    });
  }

  if (logEntries.length > 0) {
    await InventoryLog.insertMany(logEntries, { session });
    
    // Emit socket events for restored stock
    const io = getIo();
    if (io) {
      const affectedProductIds = [...new Set(items.map(item => item.productId || item._id))];
      for (const productId of affectedProductIds) {
        const updatedProduct = await Product.findById(productId);
        if (updatedProduct) {
          io.emit("stock:updated", {
            productId: updatedProduct._id,
            stock: updatedProduct.stock,
            variants: updatedProduct.variants
          });
        }
      }
    }
  }
};
