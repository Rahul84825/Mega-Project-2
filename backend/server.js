import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { initializeSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = (process.env.MONGODB_URI || "").trim();

// Fallback URI using direct hosts (non-SRV) for DNS resolver stability
const MONGODB_URI_FALLBACK = "mongodb://activegamer789_db_user:Ci8H1Si9R4kSLHvG@ac-uobfb3v-shard-00-00.b2fiqdd.mongodb.net:27017,ac-uobfb3v-shard-00-01.b2fiqdd.mongodb.net:27017,ac-uobfb3v-shard-00-02.b2fiqdd.mongodb.net:27017/?ssl=true&replicaSet=atlas-tuwzmv-shard-0&authSource=admin&appName=Mithai-world";
// Create the Node HTTP server from the configured Express app.
const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Server startup failed: Port ${PORT} is already in use`);
  } else {
    console.error("Server startup failed:", error.message);
  }
  process.exit(1);
});

// Attach Socket.IO to the same HTTP server instance.
initializeSocket(server);

const connectDB = async () => {
  // Try primary URI first, fallback to direct URI if SRV fails
  const urisToTry = [
    MONGODB_URI,
    MONGODB_URI_FALLBACK
  ].filter(Boolean);

  if (urisToTry.length === 0) {
    throw new Error("No MongoDB URIs available");
  }

  let lastError;
  for (const uri of urisToTry) {
    try {
      console.log("Attempting MongoDB connection...");
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log("✅ MongoDB connected successfully");
      return true;
    } catch (error) {
      lastError = error;
      console.error("❌ Connection attempt failed:", error.message);
    }
  }

  console.error("❌ All MongoDB connection attempts failed");
  throw lastError;
};

const boot = async () => {
  try {
    await connectDB();

    // Start accepting HTTP and Socket.IO traffic.
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log("Express API, MongoDB bootstrap, and Socket.IO are ready");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

boot();
