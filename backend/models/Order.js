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