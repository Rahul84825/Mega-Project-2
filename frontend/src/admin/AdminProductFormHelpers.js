import { calculateFinalPrice } from "../utils/priceCalculator";

/**
 * Normalize incoming variants from product into form structure
 * Each variant should have: originalPrice, discountPercent, stock, label
 */
export const normalizeIncomingVariants = (variants, variantCounterRef) => {
  const createVariantId = () => {
    variantCounterRef.current += 1;
    return `var_${Date.now().toString(36)}_${variantCounterRef.current.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  };

  if (!Array.isArray(variants) || variants.length === 0) {
    return [{
      id: createVariantId(),
      label: "Default",
      originalPrice: "",
      discountPercent: "0",
      stock: "0",
    }];
  }

  return variants.map((variant) => ({
    id: String(variant?.id || variant?._id || createVariantId()),
    label: variant?.label || "",
    // Prefer new fields, fall back to old fields for backward compatibility
    originalPrice: variant?.originalPrice ?? variant?.price ?? "",
    discountPercent: String(variant?.discountPercent ?? "0"),
    stock: variant?.stock !== undefined && variant?.stock !== null ? String(variant.stock) : "0",
  }));
};

/**
 * Validate variant data
 */
export const validateVariants = (variants) => {
  const fieldErrors = {};

  if (!Array.isArray(variants) || variants.length === 0) {
    return { general: "At least one variant is required", fieldErrors };
  }

  const ids = new Set();
  for (const variant of variants) {
    if (ids.has(variant.id)) {
      return { general: "Variant IDs must be unique", fieldErrors };
    }
    ids.add(variant.id);

    if (!(variant.label || "").trim()) {
      fieldErrors[`${variant.id}.label`] = "Label is required";
    }

    const originalPrice = Number(variant.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      fieldErrors[`${variant.id}.originalPrice`] = "Original price must be a positive number";
    }

    const discountPercent = Number(variant.discountPercent);
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 90) {
      fieldErrors[`${variant.id}.discountPercent`] = "Discount must be between 0 and 90%";
    }

    const stock = Number(variant.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      fieldErrors[`${variant.id}.stock`] = "Stock must be 0 or greater";
    }
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  return {
    general: hasFieldErrors ? "Please fix variant validation errors" : "",
    fieldErrors,
  };
};

/**
 * Calculate final price for a variant
 */
export const calculateVariantFinalPrice = (originalPrice, discountPercent) => {
  return calculateFinalPrice(Number(originalPrice) || 0, Number(discountPercent) || 0);
};

/**
 * Build payload for API submission
 */
export const buildProductPayload = (form, variants) => {
  const normalizedVariants = (variants || []).map((variant) => ({
    id: String(variant.id),
    label: String(variant.label || "").trim(),
    originalPrice: Math.round(Number(variant.originalPrice || 0)),
    discountPercent: Math.round(Number(variant.discountPercent || 0) * 100) / 100,
    stock: Math.max(0, Math.floor(Number(variant.stock || 0))),
  }));

  const variantStockTotal = normalizedVariants.reduce((sum, v) => sum + v.stock, 0);

  return {
    name: form.name,
    category: form.category,
    image: (form.images || [])[0] || "",
    images: form.images || [],
    brand: form.brand,
    tags: (form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    inStock: !!form.inStock && variantStockTotal > 0,
    isHero: !!form.isHero,
    variants: normalizedVariants,
  };
};
