import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const Schema = mongoose.Schema;
const OrderSchema = new Schema({}, { strict: false });
const Order = mongoose.model("Order", OrderSchema, "orders");

const extractOrders = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in env variables!");
    process.exit(1);
  }
  
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const orderNumbers = [
      "ORD-MPSCG997-0E7107",
      "ORD-MPSCFTOJ-B1E501",
      "ORD-MPSCFDV4-AECB24",
      "ORD-MPSCEY58-E5F2DC",
      "ORD-MPSCEHFW-B6F8BC",
      "ORD-RZP-MPSBVSIR"
    ];

    const results = {};

    for (const num of orderNumbers) {
      console.log(`Querying order: ${num}`);
      const order = await Order.findOne({ orderNumber: num });
      if (!order) {
        results[num] = null;
      } else {
        results[num] = order.toObject();
      }
    }

    const outputPath = "C:\\Users\\activ\\.gemini\\antigravity\\brain\\3cc30b84-f42f-4607-9eea-cb0d9ba6453e\\audit_orders_details.json";
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf8");
    console.log(`Successfully wrote detailed data to: ${outputPath}`);

  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await mongoose.disconnect();
  }
};

extractOrders();
