import mongoose from "mongoose";

const ORDER_STATUSES = [
  "PLACED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "DELIVERED",
  "REJECTED"
];

const PAYMENT_METHODS = ["RAZORPAY", "UPI", "CARD", "NETBANKING", "WALLET"];
const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "FAILED"
];

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, required: true },
    line2: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    country: { type: String, trim: true, default: "IN" },
    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    titleSnapshot: { type: String, required: true, trim: true },
    imageSnapshot: { type: String, required: true, trim: true },
    selectedVariant: {
      variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      label: { type: String, trim: true },
      weight: { type: String, trim: true, default: "" },
      size: { type: String, trim: true, default: "" }
    },
    gstRate: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    mrpAtPurchase: { type: Number, required: true },
    sellingPriceAtPurchase: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    stockSnapshot: {
      stockAtPurchase: { type: Number, default: null },
      warehouseId: { type: String, trim: true, default: "" }
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true }
    },
    shippingAddress: { type: addressSchema, required: true },
    items: { type: [orderItemSchema], default: [] },
    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      status: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
      gateway: { type: String, trim: true, default: "" },
      razorpayOrderId: { type: String, unique: true, sparse: true },
      razorpayPaymentId: { type: String, unique: true, sparse: true },
      razorpaySignature: { type: String, default: "" },
      paidAt: { type: Date, default: null }
    },
    status: { type: String, enum: ORDER_STATUSES, default: "PLACED" },
    statusTimestamps: {
      placedAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date, default: null },
      preparingAt: { type: Date, default: null },
      readyForPickupAt: { type: Date, default: null },
      pickedUpAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
      failedAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null }
    },
    preparation: {
      startsAt: { type: Date, default: null },
      readyBy: { type: Date, default: null },
      etaMinutes: { type: Number, default: null }
    },
    delivery: {
      provider: { type: String, trim: true, default: "" },
      providerOrderId: { type: String, trim: true, default: "" },
      trackingId: { type: String, trim: true, default: "" },
      trackingUrl: { type: String, trim: true, default: "" },
      status: { type: String, trim: true, default: "" },
      assignedAt: { type: Date, default: null },
      promisedBy: { type: Date, default: null },
      pickupOtp: { type: String, trim: true, default: "" }
    },
    rider: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      vehicleNumber: { type: String, trim: true, default: "" }
    },
    deliveryOtp: {
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      resendCount: { type: Number, default: 0 },
      lastSentAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null }
    },
    totals: {
      itemsSubtotal: { type: Number, required: true },
      gstTotal: { type: Number, required: true },
      couponDiscount: { type: Number, default: 0 },
      discountTotal: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      roundingAdjustment: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      currency: { type: String, default: "INR" }
    },
    coupon: {
      code: { type: String, uppercase: true, trim: true },
      discountType: { type: String, enum: ["PERCENTAGE", "FLAT"] },
      discountValue: { type: Number }
    },
    rejectionReason: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    if (ret.deliveryOtp) {
      delete ret.deliveryOtp.codeHash;
      delete ret.deliveryOtp.expiresAt;
    }
    return ret;
  }
});

orderSchema.set("toObject", {
  transform: (_doc, ret) => {
    if (ret.deliveryOtp) {
      delete ret.deliveryOtp.codeHash;
      delete ret.deliveryOtp.expiresAt;
    }
    return ret;
  }
});

/**
 * PERFORMANCE OPTIMIZATION: Database Indexes
 * Critical indexes for order lookup, filtering, and reporting
 */

// Note: `orderNumber` is declared with `unique: true` on the field above.
// Avoid duplicate index creation by relying on the field-level definition.

// Index for user orders (customer dashboard)
orderSchema.index({ "customer.userId": 1, createdAt: -1 });

// Index for order status tracking (admin dashboard)
orderSchema.index({ status: 1, createdAt: -1 });

// Index for payment tracking (reports)
orderSchema.index({ "payment.status": 1, "payment.method": 1 });

// Index for Razorpay payment lookups
orderSchema.index({ "payment.razorpayOrderId": 1, "payment.razorpayPaymentId": 1 }, { sparse: true });

// Index for date range queries (common in reports)
orderSchema.index({ createdAt: -1 });

// Compound index for order listing by user and date
orderSchema.index({ "customer.email": 1, createdAt: -1 });

// Index for product in orders (inventory management)
orderSchema.index({ "items.productId": 1 });

const Order = mongoose.model("Order", orderSchema);

export { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES };
export default Order;