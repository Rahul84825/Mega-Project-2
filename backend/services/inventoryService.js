import Product from "../models/Product.js";
import InventoryLog from "../models/InventoryLog.js";
import { getIo } from "../socket.js";

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

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

const calculateItemSnapshot = (product, variant, quantity) => {
  const gstRate = Number(product?.gstPercent ?? 0);
  const mrpAtPurchase = Number(variant?.mrp ?? 0);
  const sellingPriceAtPurchase = Number(variant?.finalPrice ?? variant?.sellingPrice ?? 0);
  const subtotal = roundMoney(sellingPriceAtPurchase * quantity);
  const gstAmount = roundMoney((subtotal * gstRate) / 100);
  const finalAmount = roundMoney(subtotal + gstAmount);

  return {
    gstRate,
    gstAmount,
    mrpAtPurchase,
    sellingPriceAtPurchase,
    subtotal,
    finalAmount
  };
};

export const reserveStock = async ({
  items,
  session,
  orderNumber,
  reason = "Order reservation",
  discountTotal = 0,
  shippingFee = 0,
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

    // Check stock for both simple and variant products
    const stockAvailable = isSimpleProduct ? (product.stock || 0) : (variant.stock || 0);
    if (Number(stockAvailable) < quantity) {
      throw new InventoryError(
        `${product.name} is out of stock or has insufficient quantity (requested: ${quantity}, available: ${stockAvailable})`,
        409,
        "INSUFFICIENT_STOCK"
      );
    }

    // Update stock: for simple products use product.stock, for variants use variants.N.stock
    let stockCheck;
    if (isSimpleProduct) {
      stockCheck = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { session }
      );
    } else {
      const variantPath = `variants.${variantIndex}.stock`;
      stockCheck = await Product.updateOne(
        { _id: productId, [variantPath]: { $gte: quantity } },
        { $inc: { [variantPath]: -quantity } },
        { session }
      );
    }

    if (stockCheck.modifiedCount === 0) {
      throw new InventoryError(
        `${product.name} went out of stock during checkout`,
        409,
        "STOCK_RACE"
      );
    }

    const pricing = calculateItemSnapshot(product, variant, quantity);
    itemSnapshots.push({
      productId,
      titleSnapshot: product.name,
      imageSnapshot: product.image || item?.image || "",
      selectedVariant: {
        variantId: isSimpleProduct ? null : (variant?._id || null),
        label: variant?.label || "Default",
        sku: item?.sku || "",
        weight: item?.weight || "",
        size: item?.size || ""
      },
      gstRate: pricing.gstRate,
      gstAmount: pricing.gstAmount,
      mrpAtPurchase: pricing.mrpAtPurchase,
      sellingPriceAtPurchase: pricing.sellingPriceAtPurchase,
      quantity,
      subtotal: pricing.subtotal,
      finalAmount: pricing.finalAmount,
      stockSnapshot: {
        stockAtPurchase: isSimpleProduct ? product.stock : variant.stock,
        warehouseId: item?.warehouseId || ""
      }
    });

    logEntries.push({
      productId,
      variantId: isSimpleProduct ? null : (variant?._id || null),
      variantLabel: variant?.label || "Default",
      action: "RESERVE",
      quantity,
      stockBefore: isSimpleProduct ? product.stock : variant.stock,
      stockAfter: (isSimpleProduct ? product.stock : variant.stock || 0) - quantity,
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

  const itemsSubtotal = roundMoney(itemSnapshots.reduce((sum, item) => sum + item.subtotal, 0));
  const gstTotal = roundMoney(itemSnapshots.reduce((sum, item) => sum + item.gstAmount, 0));
  const safeDiscount = roundMoney(Number(discountTotal || 0));
  const safeShipping = roundMoney(Number(shippingFee || 0));
  const safeRounding = roundMoney(Number(roundingAdjustment || 0));
  const grandTotal = roundMoney(itemsSubtotal + gstTotal + safeShipping - safeDiscount + safeRounding);

  return {
    itemSnapshots,
    totals: {
      itemsSubtotal,
      gstTotal,
      discountTotal: safeDiscount,
      shippingFee: safeShipping,
      roundingAdjustment: safeRounding,
      grandTotal
    }
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

    const variantPath = `variants.${variantIndex}.stock`;
    const product = await Product.findById(productId)
      .select(`variants.${variantIndex}.stock variants.${variantIndex}.label`)
      .session(session);
    const currentStock = Number(product?.variants?.[variantIndex]?.stock ?? 0);

    await Product.updateOne(
      { _id: productId },
      { $inc: { [variantPath]: quantity } },
      { session }
    );

    logEntries.push({
      productId,
      variantId: product?.variants?.[variantIndex]?._id || null,
      variantLabel: product?.variants?.[variantIndex]?.label || "",
      action: "RELEASE",
      quantity,
      stockBefore: currentStock,
      stockAfter: currentStock + quantity,
      orderNumber,
      reason,
      metadata: { source: "release" }
    });
  }

  if (logEntries.length > 0) {
    await InventoryLog.insertMany(logEntries, { session });
  }
};
