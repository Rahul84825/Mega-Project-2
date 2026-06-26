import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the same directory
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

// Define minimal Order schema to query
const OrderSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Order = mongoose.model("Order", OrderSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    console.log("\n--- LATEST 5 ORDERS ---");
    const latestOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    
    if (latestOrders.length === 0) {
      console.log("No orders found.");
    } else {
      latestOrders.forEach((order, index) => {
        console.log(`\nOrder #${index + 1}:`);
        console.log("ID:", order._id);
        console.log("Order Number:", order.get("orderNumber"));
        console.log("Status:", order.get("status"));
        console.log("Customer:", JSON.stringify(order.get("customer"), null, 2));
        console.log("Payment:", JSON.stringify(order.get("payment"), null, 2));
        console.log("Totals:", JSON.stringify(order.get("totals"), null, 2));
        console.log("Created At:", order.get("createdAt"));
      });
    }

  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

run();
