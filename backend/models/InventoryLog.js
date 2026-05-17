import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    variantLabel: {
      type: String,
      trim: true,
      default: ""
    },
    action: {
      type: String,
      enum: ["RESERVE", "RELEASE", "DEDUCT", "ADJUST"],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    stockBefore: {
      type: Number,
      default: null
    },
    stockAfter: {
      type: Number,
      default: null
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    orderNumber: {
      type: String,
      trim: true,
      default: ""
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

export default InventoryLog;
