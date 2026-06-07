import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      default: "PERCENTAGE"
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscount: {
      type: Number,
      default: null, // Only for percentage coupons
      min: 0
    },
    expiresAt: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: null // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    showOnCheckout: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Helper to check if coupon is valid
couponSchema.methods.isValid = function (orderAmount = 0, userId = null, userUsedCoupons = []) {
  if (!this.isActive) return { valid: false, message: "Coupon is inactive" };
  
  const now = new Date();
  if (this.expiresAt < now) return { valid: false, message: "Coupon has expired" };
  
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, message: "Coupon usage limit reached" };
  }
  
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount of ₹${this.minOrderAmount} required` };
  }

  // Check if user has already used this coupon
  if (userId && userUsedCoupons.includes(this.code)) {
    return { valid: false, message: "You have already used this coupon once" };
  }
  
  return { valid: true };
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
