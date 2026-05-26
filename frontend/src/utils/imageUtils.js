/**
 * Utility for optimizing Cloudinary image URLs.
 * Injects transformation parameters for automatic quality and format selection.
 * 
 * @param {string} url - The original Cloudinary URL.
 * @param {number} width - The desired width for the image.
 * @returns {string} - The optimized URL.
 */
export const optimizeCloudinaryUrl = (url, width = 800) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return url;
  }

  // Check if it already has transformations
  if (url.includes("/upload/q_auto,f_auto")) {
    return url;
  }

  // Inject q_auto (quality) and f_auto (format) for best compression/performance
  // Also add a width limit to prevent downloading massive original files
  return url.replace("/upload/", `/upload/q_auto,f_auto,w_${width},c_limit/`);
};
