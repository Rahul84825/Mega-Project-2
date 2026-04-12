import mongoose from "mongoose";
import { Readable } from "node:stream";
import { configureCloudinary } from "../config/cloudinary.js";
import HeroSlide from "../models/HeroSlide.js";
import { logger } from "../utils/logger.js";

const FIXED_HERO_CONTENT = {
  title: "India's Finest Mithai",
  subtitle: "Crafted with Love",
  description: "Handcrafted traditional sweets made from premium ingredients, delivered to your doorstep.",
  ctaPrimary: "Shop Now",
  ctaSecondary: "Our Story"
};

const isInvalidObjectIdError = (error) => error instanceof mongoose.Error.CastError && error.path === "_id";

const uploadBufferToCloudinary = (buffer, folder = "mithai-world/hero") => {
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

export const getHeroSlides = async (_req, res, next) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      slides
    });
  } catch (error) {
    return next(error);
  }
};

export const getHeroSlidesAdmin = async (_req, res, next) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      slides
    });
  } catch (error) {
    return next(error);
  }
};

export const createHeroSlide = async (req, res, next) => {
  try {
    const { image, order } = req.body || {};

    let imageUrl = image || "";

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploadedImage?.secure_url || imageUrl;
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "image is required"
      });
    }

    const slide = await HeroSlide.create({
      ...FIXED_HERO_CONTENT,
      image: imageUrl,
      order: Number(order || 0),
      isActive: true
    });

    logger.info("Hero slide created", {
      slideId: slide._id
    });

    return res.status(201).json({
      success: true,
      slide
    });
  } catch (error) {
    return next(error);
  }
};

export const updateHeroSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = {};

    if (req.body?.image) {
      payload.image = req.body.image;
    }

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(req.file.buffer);
      if (uploadedImage?.secure_url) {
        payload.image = uploadedImage.secure_url;
      }
    }

    if (!payload.image) {
      return res.status(400).json({
        success: false,
        message: "Provide an image to update this slide"
      });
    }

    const slide = await HeroSlide.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: "Hero slide not found"
      });
    }

    logger.info("Hero slide updated", {
      slideId: id
    });

    return res.status(200).json({
      success: true,
      slide
    });
  } catch (error) {
    if (isInvalidObjectIdError(error)) {
      return res.status(404).json({
        success: false,
        message: "Hero slide not found"
      });
    }

    return next(error);
  }
};

export const deleteHeroSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await HeroSlide.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Hero slide not found"
      });
    }

    logger.info("Hero slide deleted", {
      slideId: id
    });

    return res.status(200).json({
      success: true,
      message: "Hero slide deleted"
    });
  } catch (error) {
    if (isInvalidObjectIdError(error)) {
      return res.status(404).json({
        success: false,
        message: "Hero slide not found"
      });
    }

    return next(error);
  }
};
