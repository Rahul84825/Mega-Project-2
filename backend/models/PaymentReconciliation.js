import mongoose from "mongoose";

const paymentReconciliationSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: ""
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    customerInfo: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: "Guest", trim: true },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true }
    },
    status: {
      type: String,
      enum: ["NEEDS_ATTENTION", "RESOLVED", "REFUNDED"],
      default: "NEEDS_ATTENTION",
      index: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ""
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

paymentReconciliationSchema.index({ createdAt: -1 });

const PaymentReconciliation = mongoose.model("PaymentReconciliation", paymentReconciliationSchema);

export default PaymentReconciliation;
