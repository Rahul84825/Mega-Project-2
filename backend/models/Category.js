import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    image: {
      type: String,
      default: null
    },
    is_active: {
      type: Boolean,
      default: true
    },
    showInNavbar: {
      type: Boolean,
      default: false
    },
    showInHomepage: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ["sweets", "other"],
      default: "other"
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
