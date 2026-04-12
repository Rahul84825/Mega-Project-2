import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "India's Finest Mithai"
    },
    subtitle: {
      type: String,
      trim: true,
      default: "Crafted with Love"
    },
    description: {
      type: String,
      trim: true,
      default: "Handcrafted traditional sweets made from premium ingredients, delivered to your doorstep."
    },
    image: {
      type: String,
      required: true,
      trim: true
    },
    ctaPrimary: {
      type: String,
      trim: true,
      default: "Shop Now"
    },
    ctaSecondary: {
      type: String,
      trim: true,
      default: "Our Story"
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const HeroSlide = mongoose.model("HeroSlide", heroSlideSchema);

export default HeroSlide;
