import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  label: {
    type: String,
    trim: true,
    required: true
  },
  mrp: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Variant MRP must be an integer"
    }
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Variant selling price must be an integer"
    }
  },
  finalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Variant stock must be an integer"
    }
  }
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    gstPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    stock: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    variants: {
      type: [variantSchema],
      default: []
    },
    isHero: {
      type: Boolean,
      default: false
    },
    isSignature: {
      type: Boolean,
      default: false
    },
    brand: {
      type: String,
      trim: true,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

/**
 * PERFORMANCE OPTIMIZATION: Database Indexes
 * Indexes are created on commonly queried fields to improve query performance
 * Each index speeds up filtering, sorting, and lookups
 */

// Index for category filtering (used in product list views)
productSchema.index({ category: 1 });

// Compound index for hero products (common dashboard query)
productSchema.index({ isHero: 1, createdAt: -1 });

// Index for creation date sorting (most common sort in list views)
productSchema.index({ createdAt: -1 });

// Text index for search functionality
productSchema.index({ name: "text", description: "text", tags: "text" });

// Index for stock queries (filtering in-stock items)
productSchema.index({ "variants.stock": 1 });

// Compound index for category + active products (dashboard queries)
productSchema.index({ category: 1, isHero: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;