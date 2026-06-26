import mongoose from "mongoose";
import Order from "./models/Order.js";
import { calculateTotals } from "../shared/utils/pricing.js";

async function run() {
  console.log("Running offline Mongoose validation test...");

  try {
    // 1. Mock the itemSnapshots
    const itemSnapshots = [
      {
        productId: new mongoose.Types.ObjectId(),
        titleSnapshot: "Test Product No Image",
        imageSnapshot: "", // No image
        selectedVariant: {
          variantId: null,
          label: "Default",
          weight: "",
          size: ""
        },
        gstRate: 0,
        gstAmount: 0,
        packingCharges: 1,
        mrpAtPurchase: 100,
        sellingPriceAtPurchase: 100,
        quantity: 1,
        subtotal: 100,
        finalAmount: 100,
        stockSnapshot: {
          stockAtPurchase: 50,
          warehouseId: ""
        }
      }
    ];

    // 2. Mock Coupon TEST10
    const coupon = {
      code: "TEST10",
      discountType: "FLAT",
      discountValue: 100,
      minOrderAmount: 0,
      usageLimit: null,
      usedCount: 0,
      isActive: true
    };

    // 3. Calculate Totals
    const totals = calculateTotals(itemSnapshots, {
      coupon,
      manualDiscount: 0,
      manualShipping: 0,
      pincode: "411014",
      distance: null
    });

    console.log("Calculated Totals:", totals);

    // 4. Try to create and validate the Order document
    const orderPayload = {
      orderId: "test_order_id_" + Date.now(),
      orderNumber: `ORD-TEST-${Date.now().toString(36).toUpperCase()}`,
      customer: {
        userId: new mongoose.Types.ObjectId(),
        name: "Test Customer",
        email: "",
        phone: "9876543210"
      },
      shippingAddress: {
        line1: "123 Test Street, Viman Nagar",
        flatNo: "Flat 101",
        buildingName: "Test Heights",
        area: "Viman Nagar",
        landmark: "Near Test Mall",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411014",
        postalCode: "411014",
        fullAddress: "123 Test Street, Viman Nagar, Pune, Maharashtra, 411014",
        country: "IN"
      },
      items: itemSnapshots,
      payment: {
        method: "RAZORPAY",
        status: "PAID",
        gateway: "razorpay",
        razorpayOrderId: "rzp_order_" + Date.now(),
        razorpayPaymentId: "rzp_payment_" + Date.now(),
        razorpaySignature: "test_signature",
        paidAt: new Date()
      },
      status: "PLACED",
      statusTimestamps: {
        placedAt: new Date()
      },
      totals: {
        ...totals,
        gstTotal: totals.gstTotal || 0,
        currency: "INR"
      },
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    };

    console.log("Attempting local schema validation...");
    const orderDoc = new Order(orderPayload);
    await orderDoc.validate();
    console.log("✅ SUCCESS: Mongoose schema validation passed perfectly!");

  } catch (error) {
    console.error("❌ SCHEMA VALIDATION FAILED:");
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
