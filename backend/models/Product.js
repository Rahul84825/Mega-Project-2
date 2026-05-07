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