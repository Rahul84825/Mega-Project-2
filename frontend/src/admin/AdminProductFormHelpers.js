// Removed calculateFinalPriceWithGST and calculateSellingPriceFromDiscount imports

export const calculateSellingPriceFromDiscount = (mrp, discountPercent) => {
  if (!Number.isFinite(mrp) || mrp <= 0) return 0;
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) return mrp;
  const discountAmount = mrp * (discountPercent / 100);
  return Math.max(0, Math.round(mrp - discountAmount));
};

/**
 * Normalize incoming variants from product into form structure
 * Each variant should have: mrp, discountPercent, stock, label
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
      mrp: "",
      discountPercent: "0",
      stock: "0",
    }];
  }

  return variants.map((variant) => ({
    id: String(variant?.id || variant?._id || createVariantId()),
    label: variant?.label || "",
    mrp: variant?.mrp ?? variant?.originalPrice ?? variant?.price ?? "",
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

    const mrp = Number(variant.mrp);
    if (!Number.isFinite(mrp) || mrp <= 0) {
      fieldErrors[`${variant.id}.mrp`] = "MRP must be a positive number";
    } else if (!Number.isInteger(mrp)) {
      fieldErrors[`${variant.id}.mrp`] = "MRP must be a whole number";
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
export const calculateVariantFinalPrice = (mrp, discountPercent) => {
  return calculateSellingPriceFromDiscount(Number(mrp) || 0, Number(discountPercent) || 0);
};

/**
 * Build payload for API submission
 */
export const buildProductPayload = (form, variants) => {
  const normalizedVariants = (variants || []).map((variant) => {
    const mrp = Math.max(0, Math.floor(Number(variant.mrp || 0)));
    const discountPercent = Math.round(Number(variant.discountPercent || 0) * 100) / 100;
    const sellingPrice = calculateSellingPriceFromDiscount(mrp, discountPercent);
    const finalPrice = sellingPrice;
    return {
      id: String(variant.id),
      label: String(variant.label || "").trim(),
      mrp,
      discountPercent,
      sellingPrice,
      finalPrice,
      stock: Math.max(0, Math.floor(Number(variant.stock || 0))),
    };
  });

  return {
    name: form.name,
    category: form.category,
    image: (form.images || [])[0] || "",
    images: form.images || [],
    brand: form.brand,
    tags: (form.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    isHero: !!form.isHero,
    variants: normalizedVariants,
  };
};
