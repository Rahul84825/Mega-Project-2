import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "./app.js";
import { initializeSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const httpServer = http.createServer(app);

initializeSocket(httpServer);

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected successfully");
};

const generateJwtToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

const createDeliveryOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const boot = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log("JWT, Razorpay, Socket.IO, and Delivery OTP scaffolding is ready");
    });

    void generateJwtToken;
    void createDeliveryOtp;
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

boot();
