import { logger } from "../utils/logger.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import { configureCloudinary } from "../config/cloudinary.js";
import { Readable } from "node:stream";

const isInvalidObjectIdError = (error) => error instanceof mongoose.Error.CastError && error.path === "_id";

const normalizeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const isWholeNumber = (value) => Number.isInteger(Number(value));
const clampGstPercent = (value) => Math.max(0, Math.min(normalizeNumber(value, 0), 100));

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .map((variant) => {
      const mrp = Math.max(0, Math.floor(normalizeNumber(variant?.mrp, 0)));
      const sellingPrice = Math.max(0, Math.floor(normalizeNumber(variant?.sellingPrice ?? variant?.price, 0)));
      const stockSource = variant?.stock !== undefined ? variant.stock : (variant?.inStock === false ? 0 : 1);
      const stock = Math.max(0, Math.floor(normalizeNumber(stockSource, 0)));

      return {
        label: String(variant?.label || "Default").trim(),
        mrp,
        sellingPrice,
        stock
      };
    })
    .filter((variant) => variant.mrp > 0 && variant.sellingPrice > 0);
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

export const getProducts = async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      products
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
      product
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
      brand,
      tags,
      variants,
      gstPercent,
      isHero
    } = req.body || {};

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "name and category are required"
      });
    }

    // Validate variant mrp and sellingPrice fields
    if (Array.isArray(variants)) {
      const hasDecimalVariantPrice = variants.some(
        (variant) => {
          const mrp = variant?.mrp;
          const sellingPrice = variant?.sellingPrice ?? variant?.price;
          return (mrp !== undefined && !isWholeNumber(mrp)) || (sellingPrice !== undefined && !isWholeNumber(sellingPrice));
        }
      );

      if (hasDecimalVariantPrice) {
        return res.status(400).json({
          success: false,
          message: "Variant prices must be whole numbers (no decimals allowed)"
        });
      }

      // Validate sellingPrice <= mrp
      const invalidVariant = variants.find((variant) => {
        const mrp = Number(variant?.mrp ?? 0);
        const sellingPrice = Number(variant?.sellingPrice ?? variant?.price ?? 0);
        return mrp > 0 && sellingPrice > 0 && sellingPrice > mrp;
      });

      if (invalidVariant) {
        return res.status(400).json({
          success: false,
          message: "Selling price cannot be greater than MRP"
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

    const normalizedVariants = normalizeVariants(variants);
    const resolvedStock = Math.max(0, Math.floor(normalizeNumber(stock, 0)));
    const resolvedImages = normalizeImages(uploadedImageUrl, images);
    const resolvedGstPercent = Math.round((clampGstPercent(gstPercent) + Number.EPSILON) * 100) / 100;

    if (!normalizedVariants.length) {
      return res.status(400).json({
        success: false,
        message: "At least one variant with both MRP and selling price is required"
      });
    }

    const product = await Product.create({
      name,
      gstPercent: resolvedGstPercent,
      category: linkedCategory.slug,
      stock: resolvedStock,
      image: resolvedImages[0] || uploadedImageUrl,
      images: resolvedImages,
      description: description || "Freshly prepared mithai",
      brand: brand || "",
      tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      variants: normalizedVariants,
      isHero: Boolean(isHero)
    });

    if (product.isHero) {
      await Product.updateMany({ _id: { $ne: product._id } }, { isHero: false });
    }

    logger.info("Product created", {
      productId: product._id,
      name: product.name
    });

    return res.status(201).json({
      success: true,
      product
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
      // Validate variant mrp and sellingPrice fields
      const hasDecimalVariantPrice = Array.isArray(payload.variants)
        && payload.variants.some((variant) => {
          const mrp = variant?.mrp;
          const sellingPrice = variant?.sellingPrice ?? variant?.price;
          return (mrp !== undefined && !isWholeNumber(mrp)) || (sellingPrice !== undefined && !isWholeNumber(sellingPrice));
        });

      if (hasDecimalVariantPrice) {
        return res.status(400).json({
          success: false,
          message: "Variant prices must be whole numbers (no decimals allowed)"
        });
      }

      // Validate sellingPrice <= mrp
      const invalidVariant = payload.variants.find((variant) => {
        const mrp = Number(variant?.mrp ?? 0);
        const sellingPrice = Number(variant?.sellingPrice ?? variant?.price ?? 0);
        return mrp > 0 && sellingPrice > 0 && sellingPrice > mrp;
      });

      if (invalidVariant) {
        return res.status(400).json({
          success: false,
          message: "Selling price cannot be greater than MRP"
        });
      }

      const normalizedVariants = normalizeVariants(payload.variants);
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

    if (payload.isHero === true) {
      await Product.updateMany({ _id: { $ne: id } }, { isHero: false });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    logger.info("Product updated", {
      productId: id
    });

    return res.status(200).json({
      success: true,
      product: updatedProduct
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


