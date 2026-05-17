import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    discount_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    image: {
      type: String,
      trim: true,
      default: ""
    },
    offer_type: {
      type: String,
      enum: ["banner", "category", "product"],
      default: "banner"
    },
    linked_product_id: {
      type: String,
      default: ""
    },
    linked_category_id: {
      type: String,
      default: ""
    },
    priority: {
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

offerSchema.virtual("active")
  .get(function getActive() {
    return this.isActive;
  })
  .set(function setActive(value) {
    this.isActive = Boolean(value);
  });

offerSchema.set("toJSON", { virtuals: true });
offerSchema.set("toObject", { virtuals: true });

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;