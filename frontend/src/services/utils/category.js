/**
 * Normalize and slugify category strings
 * Converts to lowercase and replaces spaces with hyphens
 * @param {string} str - The category string to slugify
 * @returns {string} - The slugified category
 */
export const slugify = (str) => {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
};

/**
 * Normalize category for filter comparison
 * Returns empty string for "all" category, otherwise returns slugified version
 * @param {string} value - The category value to normalize
 * @returns {string} - Normalized category
 */
export const normalizeCategory = (value) => {
  const normalized = slugify(value);
  return normalized === "all" ? "" : normalized;
};

/**
 * Extract category from product object
 * Handles different product schema formats
 * @param {object} product - The product object
 * @returns {string} - The normalized category slug
 */
export const getProductCategory = (product) => {
  if (!product) return "";

  const categoryValue = product?.category;

  if (typeof categoryValue === "string") {
    return normalizeCategory(categoryValue);
  }

  return normalizeCategory(
    categoryValue?.slug || categoryValue?.name || product?.categorySlug
  );
};
