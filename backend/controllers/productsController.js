import { logger } from "../utils/logger.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import { configureCloudinary } from "../config/cloudinary.js";
import { Readable } from "node:stream";
import { getIo } from "../socket.js";

const isInvalidObjectIdError = (error) => error instanceof mongoose.Error.CastError && error.path === "_id";

const normalizeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const isWholeNumber = (value) => Number.isInteger(Number(value));
const clampPercent = (value) => Math.max(0, Math.min(normalizeNumber(value, 0), 100));
const clampGstPercent = (value) => clampPercent(value);

const calculateSellingPrice = (mrp, discountPercent) => {
  const safeMrp = Math.max(0, Math.round(normalizeNumber(mrp, 0)));
  const safeDiscount = clampPercent(discountPercent);
  return Math.max(0, Math.round(safeMrp - (safeMrp * safeDiscount) / 100));
};

const calculateFinalPrice = (sellingPrice, gstPercent) => {
  // BUSINESS RULE: GST is already included in admin product pricing.
  // DO NOT double-add GST anywhere.
  return Math.max(0, Math.round(normalizeNumber(sellingPrice, 0)));
};

const resolveDiscountPercent = (variant, mrp, sellingPriceFallback) => {
  const provided = normalizeNumber(variant?.discountPercent, NaN);
  if (Number.isFinite(provided)) {
    return clampPercent(provided);
  }

  const safeMrp = Math.max(0, normalizeNumber(mrp, 0));
  const safeSelling = Math.max(0, normalizeNumber(sellingPriceFallback, 0));
  if (safeMrp <= 0) {
    return 0;
  }

  const discount = ((safeMrp - safeSelling) / safeMrp) * 100;
  return clampPercent(discount);
};

const normalizeVariants = (variants, gstPercent = 0) => {
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .map((variant) => {
      const mrp = Math.max(0, Math.round(normalizeNumber(variant?.mrp, 0)));
      const sellingPriceFallback = normalizeNumber(variant?.sellingPrice ?? variant?.price, 0);
      const discountPercent = resolveDiscountPercent(variant, mrp, sellingPriceFallback);
      const sellingPrice = calculateSellingPrice(mrp, discountPercent);
      const finalPrice = calculateFinalPrice(sellingPrice, gstPercent);
      const stock = Math.max(0, Math.floor(normalizeNumber(variant?.stock, 0)));
      const isAvailable = variant?.isAvailable !== undefined ? Boolean(variant.isAvailable) : true;

      const normalized = {
        label: String(variant?.label || "Default").trim(),
        mrp,
        discountPercent,
        sellingPrice,
        finalPrice,
        stock,
        isAvailable
      };

      // Preserve ID if it exists and looks like a valid MongoDB ID
      const existingId = variant?._id || variant?.id;
      if (existingId && String(existingId).length === 24) {
        normalized._id = existingId;
      }

      return normalized;
    })
    .filter((variant) => variant.mrp > 0 && variant.sellingPrice > 0);
};

const normalizeProductForResponse = (product) => {
  if (!product) {
    return product;
  }

  const plain = typeof product.toObject === "function" ? product.toObject() : { ...product };
  
  // Ensure IDs are strings to prevent numeric mangling in frontend
  if (plain._id) plain._id = String(plain._id);
  
  const gstPercent = clampGstPercent(plain.gstPercent);
  const packingCharges = normalizeNumber(plain.packingCharges, 0);
  const variants = Array.isArray(plain.variants) ? plain.variants : [];

  return {
    ...plain,
    _id: String(plain._id),
    gstPercent,
    packingCharges,
    variants: variants.map((variant, index) => {
      const mrp = Math.max(0, Math.round(normalizeNumber(variant?.mrp, 0)));
      const sellingPriceFallback = normalizeNumber(variant?.sellingPrice ?? variant?.price, 0);
      const discountPercent = resolveDiscountPercent(variant, mrp, sellingPriceFallback);
      const sellingPrice = calculateSellingPrice(mrp, discountPercent);
      const finalPrice = calculateFinalPrice(sellingPrice, gstPercent);
      const stock = Math.max(0, Math.floor(normalizeNumber(variant?.stock, 0)));

      return {
        ...variant,
        _id: variant?._id ? String(variant._id) : `${plain._id}_variant_${index + 1}`,
        label: String(variant?.label || `Variant ${index + 1}`).trim(),
        mrp,
        discountPercent,
        sellingPrice,
        finalPrice,
        stock,
        isAvailable: variant?.isAvailable !== undefined ? Boolean(variant.isAvailable) : true
      };
    })
  };
};



const normalizeImages = (image, images = []) => {
  const normalized = Array.from(new Set([image, ...(Array.isArray(images) ? images : [])].filter(Boolean)));
  return normalized;
};

const uploadBufferToCloudinary = (buffer, folder = "mithai-world/products") => {
  const cloudinary = configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

export const getProducts = async (req, res, next) => {
  try {
    // PAGINATION: Extract limit and page from query parameters
    // SAFE FIX: Disable mandatory pagination by default if no params are provided.
    // This prevents products from "disappearing" in the Admin Panel which doesn't support pagination UI.
    const providedLimit = req.query.limit ? Number(req.query.limit) : null;
    const providedPage = req.query.page ? Number(req.query.page) : null;
    
    const isPaginated = providedLimit !== null || providedPage !== null;
    const limit = isPaginated ? Math.min(Math.max(providedLimit || 20, 1), 1000) : 0; // 0 = No limit in Mongoose
    const page = Math.max(providedPage || 1, 1);
    const skip = limit > 0 ? (page - 1) * limit : 0;

    // OPTIMIZATION: Use lean() to exclude unnecessary fields for list view
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    // Get total count for pagination metadata (cached separately)
    const totalCount = await Product.countDocuments();

    // Calculate pagination info
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1;
    const hasNextPage = limit > 0 ? page < totalPages : false;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      products: products.map(normalizeProductForResponse),
      pagination: {
        page,
        limit: limit || totalCount,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      product: normalizeProductForResponse(product)
    });
  } catch (error) {
    if (isInvalidObjectIdError(error)) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      stock,
      image,
      images,
      description,
      tags,
      variants,
      gstPercent,
      packingCharges,
      isHero,
      isSignature,
      isSnack,
      isMalaiBarfi,
      isActive
    } = req.body || {};

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "name and category are required"
      });
    }

    // ... (validation code same as before)
    if (Array.isArray(variants)) {
      const hasDecimalVariantPrice = variants.some((variant) => {
        const mrp = variant?.mrp;
        return mrp !== undefined && !isWholeNumber(mrp);
      });

      if (hasDecimalVariantPrice) {
        return res.status(400).json({
          success: false,
          message: "Variant prices must be whole numbers (no decimals allowed)"
        });
      }

      const invalidDiscount = variants.find((variant) => {
        const discountPercent = variant?.discountPercent;
        return discountPercent !== undefined && (!Number.isFinite(Number(discountPercent)) || Number(discountPercent) < 0 || Number(discountPercent) > 100);
      });

      if (invalidDiscount) {
        return res.status(400).json({
          success: false,
          message: "Discount percent must be between 0 and 100"
        });
      }
    }

    const normalizedCategorySlug = String(category).trim().toLowerCase();
    const linkedCategory = await Category.findOne({ slug: normalizedCategorySlug });
    if (!linkedCategory) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist"
      });
    }

    let uploadedImageUrl = image || "";

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      uploadedImageUrl = uploadedImage?.secure_url || image || "";
    }

    const resolvedGstPercent = Math.round((clampGstPercent(gstPercent) + Number.EPSILON) * 100) / 100;
    const normalizedVariants = normalizeVariants(variants, resolvedGstPercent);
    const resolvedStock = Math.max(0, Math.floor(normalizeNumber(stock, 0)));
    const resolvedImages = normalizeImages(uploadedImageUrl, images);

    if (!normalizedVariants.length) {
      return res.status(400).json({
        success: false,
        message: "At least one variant with both MRP and selling price is required"
      });
    }

    const product = await Product.create({
      name,
      gstPercent: resolvedGstPercent,
      packingCharges: normalizeNumber(packingCharges, 0),
      category: linkedCategory.slug,
      stock: resolvedStock,
      image: resolvedImages[0] || uploadedImageUrl,
      images: resolvedImages,
      description: description || "Freshly prepared mithai",
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      variants: normalizedVariants,
      isHero: Boolean(isHero),
      isSignature: Boolean(isSignature),
      isSnack: Boolean(isSnack),
      isMalaiBarfi: Boolean(isMalaiBarfi),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    if (product.isHero) {
      await Product.updateMany({ _id: { $ne: product._id } }, { isHero: false });
    }

    logger.info("Product created", {
      productId: product._id,
      name: product.name
    });

    // ✅ Emit socket event for real-time UI update
    const io = getIo();
    if (io) {
      io.emit("product:created", normalizeProductForResponse(product));
    }

    return res.status(201).json({
      success: true,
      product: normalizeProductForResponse(product)
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    logger.info("Product deleted", {
      productId: id
    });

    // ✅ Emit socket event for real-time UI update
    const io = getIo();
    if (io) {
      io.emit("product:deleted", id);
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    if (isInvalidObjectIdError(error)) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentProduct = await Product.findById(id);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const payload = {
      ...req.body
    };

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      if (uploadedImage?.secure_url) {
        payload.image = uploadedImage.secure_url;
      }
    }

    if (payload.stock !== undefined) {
      payload.stock = Math.max(0, Math.floor(normalizeNumber(payload.stock, currentProduct.stock)));
    }

    if (payload.variants !== undefined) {
      // Validate variant mrp and discountPercent fields
      const hasDecimalVariantPrice = Array.isArray(payload.variants)
        && payload.variants.some((variant) => {
          const mrp = variant?.mrp;
          return mrp !== undefined && !isWholeNumber(mrp);
        });

      if (hasDecimalVariantPrice) {
        return res.status(400).json({
          success: false,
          message: "Variant prices must be whole numbers (no decimals allowed)"
        });
      }

      const invalidDiscount = payload.variants.find((variant) => {
        const discountPercent = variant?.discountPercent;
        return discountPercent !== undefined && (!Number.isFinite(Number(discountPercent)) || Number(discountPercent) < 0 || Number(discountPercent) > 100);
      });

      if (invalidDiscount) {
        return res.status(400).json({
          success: false,
          message: "Discount percent must be between 0 and 100"
        });
      }

      const gstPercentValue = payload.gstPercent !== undefined
        ? clampGstPercent(payload.gstPercent)
        : currentProduct.gstPercent;
      const normalizedVariants = normalizeVariants(payload.variants, gstPercentValue);
      payload.variants = normalizedVariants;

      if (!normalizedVariants.length) {
        return res.status(400).json({
          success: false,
          message: "At least one variant with both MRP and selling price is required"
        });
      }
    }

    if (payload.gstPercent !== undefined) {
      payload.gstPercent = Math.round((clampGstPercent(payload.gstPercent) + Number.EPSILON) * 100) / 100;
    }

    if (payload.images !== undefined || payload.image !== undefined) {
      payload.images = normalizeImages(payload.image ?? currentProduct.image, payload.images ?? currentProduct.images);
      payload.image = payload.images[0] || payload.image || currentProduct.image;
    }

    if (payload.tags !== undefined && !Array.isArray(payload.tags)) {
      payload.tags = [];
    }

    if (payload.category !== undefined) {
      const normalizedCategorySlug = String(payload.category || "").trim().toLowerCase();
      const linkedCategory = await Category.findOne({ slug: normalizedCategorySlug });
      if (!linkedCategory) {
        return res.status(400).json({
          success: false,
          message: "Selected category does not exist"
        });
      }
      payload.category = linkedCategory.slug;
    }

    if (payload.isHero !== undefined) {
      payload.isHero = Boolean(payload.isHero);
      if (payload.isHero === true) {
        await Product.updateMany({ _id: { $ne: id } }, { isHero: false });
      }
    }

    if (payload.isSignature !== undefined) {
      payload.isSignature = Boolean(payload.isSignature);
    }

    if (payload.isSnack !== undefined) {
      payload.isSnack = Boolean(payload.isSnack);
    }

    if (payload.isMalaiBarfi !== undefined) {
      payload.isMalaiBarfi = Boolean(payload.isMalaiBarfi);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    logger.info("Product updated", {
      productId: id
    });

    // ✅ Emit socket event for real-time UI update
    const io = getIo();
    if (io) {
      io.emit("product:updated", normalizeProductForResponse(updatedProduct));
    }

    return res.status(200).json({
      success: true,
      product: normalizeProductForResponse(updatedProduct)
    });
  } catch (error) {
    if (isInvalidObjectIdError(error)) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return next(error);
  }
};

/**
 * Toggle active status for a product (Storefront Visibility)
 * PATCH /api/products/:id/toggle-status
 */
export const toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isActive = !!isActive;
    await product.save();

    logger.info(`Product status toggled: ${product.name} -> ${product.isActive ? 'ACTIVE' : 'INACTIVE'}`);

    const io = getIo();
    if (io) {
      io.emit("product:updated", normalizeProductForResponse(product));
    }

    return res.status(200).json({
      success: true,
      product: normalizeProductForResponse(product)
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Toggle active status for a specific variant
 * PATCH /api/products/:id/variants/:variantId/toggle-status
 */
export const toggleVariantStatus = async (req, res, next) => {
  try {
    const { id, variantId } = req.params;
    const { isAvailable } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variantIndex = product.variants.findIndex(v => String(v._id) === String(variantId));
    if (variantIndex === -1) {
      return res.status(404).json({ success: false, message: "Variant not found" });
    }

    product.variants[variantIndex].isAvailable = !!isAvailable;

    // Auto-toggle product visibility based on variants
    const hasAvailableVariant = product.variants.some(v => v.isAvailable !== false);
    product.isActive = hasAvailableVariant;

    await product.save();

    logger.info(`Variant status toggled: ${product.name} [${product.variants[variantIndex].label}] -> ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}. Product is now ${product.isActive ? 'ACTIVE' : 'INACTIVE'}`);

    const io = getIo();
    if (io) {
      io.emit("product:updated", normalizeProductForResponse(product));
    }

    return res.status(200).json({
      success: true,
      product: normalizeProductForResponse(product)
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get stock information for products and variants
 * GET /api/products/stock/info
 */
export const getStockInfo = async (req, res, next) => {
  try {
    const { productIds, variantIds } = req.query;

    if (!productIds && !variantIds) {
      return res.status(400).json({
        success: false,
        message: "Either productIds or variantIds query parameter is required"
      });
    }

    const stockInfo = [];

    // Handle product IDs
    if (productIds) {
      const ids = String(productIds).split(",").map(id => id.trim()).filter(Boolean);
      
      for (const id of ids) {
        const product = await Product.findById(id).select("name stock variants isActive");
        
        if (!product) {
          stockInfo.push({
            productId: id,
            error: "Product not found"
          });
          continue;
        }

        // Check if product has variants
        if (Array.isArray(product.variants) && product.variants.length > 0) {
          // Variant product
          stockInfo.push({
            productId: id,
            name: product.name,
            type: "variants",
            variants: product.variants.map(v => ({
              variantId: v._id,
              label: v.label,
              stock: Number(v.stock || 0),
              isAvailable: v.isAvailable !== false
            }))
          });
        } else {
          // Simple product
          stockInfo.push({
            productId: id,
            name: product.name,
            type: "simple",
            stock: Number(product.stock || 0),
            isAvailable: product.isActive !== false
          });
        }
      }
    }

    // Handle variant IDs
    if (variantIds) {
      const ids = String(variantIds).split(",").map(id => id.trim()).filter(Boolean);
      
      const products = await Product.find({ "variants._id": { $in: ids } }).select("_id name variants");
      
      for (const variantId of ids) {
        let found = false;
        
        for (const product of products) {
          const variant = product.variants.find(v => String(v._id) === String(variantId));
          
          if (variant) {
            stockInfo.push({
              productId: product._id,
              variantId: variant._id,
              label: variant.label,
              stock: Number(variant.stock || 0),
              isAvailable: variant.isAvailable !== false
            });
            found = true;
            break;
          }
        }
        
        if (!found) {
          stockInfo.push({
            variantId,
            error: "Variant not found"
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      stock: stockInfo
    });
  } catch (error) {
    return next(error);
  }
};
