const getVariantWeight = (variant) => {
  const label = String(variant?.label || "").trim().toLowerCase();
  const match = label.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gram|grams)?/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const amount = Number(match[1]) || 0;
  const unit = String(match[2] || "gm").toLowerCase();

  if (unit === "kg") {
    return amount * 1000;
  }

  return amount;
};

export const sortVariantsByLabel = (variants = []) =>
  [...variants].sort((a, b) => getVariantWeight(a) - getVariantWeight(b));

export const getDisplayPrice = (product) => {
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) {
    return 0;
  }

  const firstVariant = product.variants[0];
  return Number(firstVariant?.finalPrice ?? 0) || 0;
};