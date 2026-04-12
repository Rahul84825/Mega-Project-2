import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true
    },
    label: {
      type: String,
      trim: true,
      default: ""
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    discountPercent: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      default: 0
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
    inStock: {
      type: Boolean,
      default: true
    },
    isHero: {
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

const Product = mongoose.model("Product", productSchema);

export default Product;