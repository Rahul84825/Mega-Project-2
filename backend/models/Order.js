import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    items: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    status: {
      type: String,
      default: "Pending"
    },
    paymentStatus: {
      type: String,
      default: "paid"
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "out_for_delivery", "delivered"],
      default: "pending"
    },
    deliveryOTP: {
      type: String
    },
    otpExpiresAt: {
      type: Date
    },
    deliveryVerified: {
      type: Boolean,
      default: false
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true
    },
    razorpaySignature: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;