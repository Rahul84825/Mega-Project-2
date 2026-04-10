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
      type: String,
      select: false
    },
    otpExpiresAt: {
      type: Date,
      select: false
    },
    otpResendCount: {
      type: Number,
      default: 0
    },
    otpLastSentAt: {
      type: Date,
      default: null
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

orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.deliveryOTP;
    delete ret.otpExpiresAt;
    return ret;
  }
});

orderSchema.set("toObject", {
  transform: (_doc, ret) => {
    delete ret.deliveryOTP;
    delete ret.otpExpiresAt;
    return ret;
  }
});

const Order = mongoose.model("Order", orderSchema);

export default Order;