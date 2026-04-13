import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { uploadCategoryImage } from "./uploadController.js";

const toSlug = (name) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const getCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug: slugInput, is_active = true, showInNavbar = false, showInHomepage = false, order = 0 } = req.body || {};
    const slug = toSlug(slugInput || name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Invalid category name"
      });
    }

    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Category already exists"
      });
    }

    // Handle image upload if file is provided
    let imageUrl = null;
    if (req.file?.buffer) {
      try {
        imageUrl = await uploadCategoryImage(req.file.buffer);
      } catch (error) {
        console.error("❌ Image upload failed:", error);
        return res.status(400).json({
          success: false,
          message: "Image upload failed: " + (error.message || "Unknown error")
        });
      }
    }

    const category = await Category.create({
      name: String(name || "").trim(),
      slug,
      image: imageUrl,
      is_active: Boolean(is_active),
      showInNavbar: Boolean(showInNavbar),
      showInHomepage: Boolean(showInHomepage),
      order: Number(order || 0)
    });

    return res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, is_active, showInNavbar, showInHomepage, order } = req.body || {};

    const existing = await Category.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const updates = {};

    if (name !== undefined) {
      const nextSlug = toSlug(name);
      if (!nextSlug) {
        return res.status(400).json({
          success: false,
          message: "Invalid category name"
        });
      }

      const duplicate = await Category.findOne({ slug: nextSlug, _id: { $ne: existing._id } });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Category already exists"
        });
      }

      updates.name = String(name || "").trim();
      updates.slug = nextSlug;
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }
    if (showInNavbar !== undefined) {
      updates.showInNavbar = Boolean(showInNavbar);
    }
    if (showInHomepage !== undefined) {
      updates.showInHomepage = Boolean(showInHomepage);
    }
    if (order !== undefined) {
      updates.order = Number(order || 0);
    }

    // Handle image upload if file is provided
    if (req.file?.buffer) {
      try {
        const imageUrl = await uploadCategoryImage(req.file.buffer);
        updates.image = imageUrl;
      } catch (error) {
        console.error("❌ Image upload failed:", error);
        return res.status(400).json({
          success: false,
          message: "Image upload failed: " + (error.message || "Unknown error")
        });
      }
    }

    const category = await Category.findOneAndUpdate({ _id: existing._id }, updates, {
      new: true,
      runValidators: true
    });

    if (updates.slug && existing.slug !== updates.slug) {
      await Product.updateMany({ category: existing.slug }, { category: updates.slug });
    }

    return res.status(200).json({
      success: true,
      category
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await Category.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const productsUsingCategory = await Product.countDocuments({ category: existing.slug });
    if (productsUsingCategory > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete category that has products"
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted"
    });
  } catch (error) {
    return next(error);
  }
};
