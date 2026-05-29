import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const inspectDb = async () => {
  console.log("\n========== MONGODB LIVE INSPECTION ==========");
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB Atlas...");
  
  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to MongoDB.");

    // Find orders that have a providerOrderId or non-empty webhookHistory
    const orders = await Order.find({
      $or: [
        { "delivery.providerOrderId": { $ne: "" } },
        { "delivery.webhookHistory": { $exists: true, $not: { $size: 0 } } }
      ]
    }).sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders with Borzo delivery/webhook data.`);

    for (const order of orders) {
      console.log("\n-----------------------------------------");
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Order Status: ${order.status}`);
      console.log(`Rider Info: Name: "${order.rider?.name}", Phone: "${order.rider?.phone}", Vehicle: "${order.rider?.vehicleNumber}"`);
      console.log("Delivery Data:");
      console.log(`  Provider: ${order.delivery?.provider}`);
      console.log(`  Provider Order ID: ${order.delivery?.providerOrderId}`);
      console.log(`  Delivery Status: ${order.delivery?.status}`);
      console.log(`  OTP: ${order.delivery?.pickupOtp}`);
      console.log(`  Webhook History Count: ${order.delivery?.webhookHistory?.length || 0}`);
      
      if (order.delivery?.webhookHistory && order.delivery.webhookHistory.length > 0) {
        console.log("  Webhook History Payloads:");
        order.delivery.webhookHistory.forEach((h, idx) => {
          console.log(`    [${idx}] Event: "${h.event}", Received At: ${h.receivedAt.toISOString()}`);
          console.log(`        Payload:`, JSON.stringify(h.payload, null, 2));
        });
      }
    }
    
    console.log("\n========== INSPECTION COMPLETE ==========");
  } catch (error) {
    console.error("❌ MongoDB connection or query failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

inspectDb();
