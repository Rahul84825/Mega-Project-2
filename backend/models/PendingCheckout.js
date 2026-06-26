import mongoose from "mongoose";

const pendingCheckoutSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    orderData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400 // Automatically delete after 24 hours (TTL index)
    }
  },
  { timestamps: true }
);

const PendingCheckout = mongoose.model("PendingCheckout", pendingCheckoutSchema);

export default PendingCheckout;
