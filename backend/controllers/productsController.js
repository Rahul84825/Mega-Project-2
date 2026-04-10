import { logger } from "../utils/logger.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { configureCloudinary } from "../config/cloudinary.js";
import { Readable } from "node:stream";

const isInvalidObjectIdError = (error) => error instanceof mongoose.Error.CastError && error.path === "_id";

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
    const { name, price, category, stock, image, description } = req.body || {};

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "name, price, and category are required"
      });
    }

    let uploadedImageUrl = image || "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400";

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      uploadedImageUrl = uploadedImage?.secure_url || uploadedImageUrl;
    }

    const product = await Product.create({
      name,
      price: Number(price),
      category,
      stock: Number(stock || 0),
      image: uploadedImageUrl,
      description: description || "Freshly prepared mithai"
    });

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
    const payload = {
      ...req.body
    };

    if (payload.price !== undefined) {
      payload.price = Number(payload.price);
    }

    if (payload.stock !== undefined) {
      payload.stock = Number(payload.stock);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

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
