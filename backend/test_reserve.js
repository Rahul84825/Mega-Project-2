import mongoose from "mongoose";
import Product from "./models/Product.js";
import Coupon from "./models/Coupon.js";
import Order from "./models/Order.js";
import { reserveStock } from "./services/inventoryService.js";

// Monkey-patch Product.findById and Coupon.findOne
const mockProductId = new mongoose.Types.ObjectId();
const mockCouponId = new mongoose.Types.ObjectId();

Product.findById = function() {
  return {
    select: function() {
      return {
        session: function() {
          return {
            _id: mockProductId,
            name: "Test Product No Image",
            basePrice: 100,
            mrp: 100,
            price: 100,
            stock: 50,
            category: "sweets",
            image: "",
            images: [],
            packingCharges: 1,
            gstPercent: 0,
            variants: []
          };
        }
      };
    }
  };
};

Coupon.findOne = function() {
  return {
    _id: mockCouponId,
    code: "TEST10",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 0,
    usageLimit: null,
    usedCount: 0,
    isActive: true,
    isValid: function() {
      return { valid: true };
    }
  };
};

// Mock InventoryLog.insertMany to do nothing
import InventoryLog from "./models/InventoryLog.js";
InventoryLog.insertMany = async function() {
  return [];
};

async function run() {
  console.log("Running offline reserveStock test...");

  try {
    const items = [
      {
        productId: mockProductId.toString(),
        quantity: 1,
        variantLabel: "Default"
      }
    ];

    const { itemSnapshots, totals } = await reserveStock({
      items,
      session: null,
      orderNumber: "TEST-123",
      reason: "Test",
      coupon: Coupon.findOne(), // use mock coupon
      discountTotal: 0,
      shippingFee: 0,
      pincode: "411014",
      distance: null
    });

    console.log("--- reserveStock OUTPUT ---");
    console.log("Totals:", totals);
    console.log("Item Snapshots:", JSON.stringify(itemSnapshots, null, 2));

    // Create Order payload
    const orderPayload = {
      orderId: "test_order_" + Date.now(),
      orderNumber: "ORD-TEST-123",
      customer: {
        userId: new mongoose.Types.ObjectId(),
        name: "Guest",
        email: "guest@example.com",
        phone: "9876543210"
      },
      shippingAddress: {
        line1: "123 Street",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411014"
      },
      items: itemSnapshots,
      payment: {
        method: "RAZORPAY",
        status: "PAID",
        razorpayOrderId: "rzp_order_123",
        razorpayPaymentId: "rzp_payment_123"
      },
      totals: {
        ...totals,
        gstTotal: totals.gstTotal || 0
      }
    };

    console.log("Validating Order schema with reserveStock output...");
    const orderDoc = new Order(orderPayload);
    await orderDoc.validate();
    console.log("✅ SUCCESS: Mongoose schema validation passed!");

  } catch (error) {
    console.error("❌ FAILED:");
    if (error.errors) {
      console.error(error.message);
      for (const field in error.errors) {
        console.error(`Field: ${field} | Message: ${error.errors[field].message}`);
      }
    } else {
      console.error(error);
    }
  }
}

run();
