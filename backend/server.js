import "dotenv/config";
import dns from "dns";

// ── BOOTSTRAP: Environment Variables loaded via import ──
console.log(`🚀 BOOT: Environment loaded. NODE_ENV: ${process.env.NODE_ENV || "development"}`);

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { initializeSocket } from "./socket.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
const MONGODB_URI_FALLBACK = (process.env.MONGODB_URI_FALLBACK || "").trim();

console.log(`🚀 BOOT: Initializing server on port ${PORT}...`);

// Create the Node HTTP server from the configured Express app.
const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ BOOT ERROR: Port ${PORT} is already in use`);
  } else {
    console.error("❌ BOOT ERROR:", error.message);
  }
  process.exit(1);
});

// Attach Socket.IO to the same HTTP server instance.
initializeSocket(server);

const connectDB = async () => {
  const candidates = [MONGODB_URI, MONGODB_URI_FALLBACK].filter(Boolean);

  if (candidates.length === 0) {
    console.error("❌ BOOT ERROR: No MongoDB URIs available in environment");
    throw new Error("No MongoDB URIs available");
  }

  let lastError;

  for (const [index, uri] of candidates.entries()) {
    try {
      const isFallback = index > 0;
      console.log(`🔌 DB: Attempting connection${isFallback ? " (fallback)" : ""}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`✅ DB: Connected successfully${isFallback ? " using fallback URI" : ""}`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ DB: Connection attempt ${index + 1} failed:`, error.message);
    }
  }

  throw lastError;
};

const boot = async () => {
  try {
    console.log("🚀 BOOT: Connecting to database...");
    await connectDB();

    // Start accepting HTTP and Socket.IO traffic.
    server.listen(PORT, () => {
      console.log(`✅ BOOT: Server listening on port ${PORT}`);
      console.log("🚀 BOOT: Mithai World Backend is READY");
    });
  } catch (error) {
    console.error("❌ BOOT CRITICAL FAILURE:", error.message);
    process.exit(1);
  }
};

boot();
