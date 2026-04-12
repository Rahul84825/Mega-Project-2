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

const clampDiscount = (value) => Math.max(0, Math.min(normalizeNumber(value, 0), 90));

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .map((variant, index) => {
      const originalPrice = normalizeNumber(variant?.originalPrice ?? variant?.price, 0);
      const discountPercent = clampDiscount(variant?.discountPercent);
      const stock = Math.max(0, Math.floor(normalizeNumber(variant?.stock, 0)));

      return {
        id: String(variant?.id || variant?._id || `variant_${index + 1}`),
        label: String(variant?.label || "Default").trim(),
        originalPrice: Math.round((originalPrice + Number.EPSILON) * 100) / 100,
        discountPercent: Math.round((discountPercent + Number.EPSILON) * 100) / 100,
        stock
      };
    })
    .filter((variant) => variant.originalPrice > 0);
};

const derivePriceStockFromVariants = (variants = []) => {
  if (!variants.length) {
    return {
      price: 0,
      stock: 0,
      inStock: false
    };
  }

  const variantPrices = variants.map((variant) => {
    const original = normalizeNumber(variant.originalPrice, 0);
    const discount = clampDiscount(variant.discountPercent);
    return Math.max(0, Math.round((original - (original * discount) / 100 + Number.EPSILON) * 100) / 100);
  });

  const stock = variants.reduce((sum, variant) => sum + Math.max(0, Math.floor(normalizeNumber(variant.stock, 0))), 0);

  return {
    price: variantPrices.length ? Math.min(...variantPrices) : 0,
    stock,
    inStock: stock > 0
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
      price,
      category,
      stock,
      image,
      images,
      description,
      brand,
      tags,
      variants,
      inStock,
      isHero
    } = req.body || {};

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: "name and category are required"
      });
    }

    const normalizedCategorySlug = String(category).trim().toLowerCase();
    const linkedCategory = await Category.findOne({ slug: normalizedCategorySlug });
    if (!linkedCategory) {
      return res.status(400).json({
        success: false,
        message: "Selected category does not exist"
      });
    }

    let uploadedImageUrl = image || "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400";

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      uploadedImageUrl = uploadedImage?.secure_url || uploadedImageUrl;
    }

    const normalizedVariants = normalizeVariants(variants);
    const derived = derivePriceStockFromVariants(normalizedVariants);
    const resolvedPrice = normalizedVariants.length ? derived.price : normalizeNumber(price, 0);
    const resolvedStock = normalizedVariants.length ? derived.stock : Math.max(0, Math.floor(normalizeNumber(stock, 0)));
    const resolvedInStock = typeof inStock === "boolean" ? inStock : resolvedStock > 0;
    const resolvedImages = normalizeImages(uploadedImageUrl, images);

    if (resolvedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "price must be greater than zero"
      });
    }

    const product = await Product.create({
      name,
      price: resolvedPrice,
      category: linkedCategory.slug,
      stock: resolvedStock,
      inStock: resolvedInStock,
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

    if (payload.price !== undefined) {
      payload.price = normalizeNumber(payload.price, currentProduct.price);
    }

    if (payload.stock !== undefined) {
      payload.stock = Math.max(0, Math.floor(normalizeNumber(payload.stock, currentProduct.stock)));
    }

    if (payload.variants !== undefined) {
      const normalizedVariants = normalizeVariants(payload.variants);
      payload.variants = normalizedVariants;

      if (normalizedVariants.length) {
        const derived = derivePriceStockFromVariants(normalizedVariants);
        payload.price = derived.price;
        payload.stock = derived.stock;
        payload.inStock = derived.inStock;
      }
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
