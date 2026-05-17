import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { initializeSocket } from "./socket.js";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
const MONGODB_URI_FALLBACK = (process.env.MONGODB_URI_FALLBACK || "").trim();
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
  const candidates = [MONGODB_URI, MONGODB_URI_FALLBACK].filter(Boolean);

  if (candidates.length === 0) {
    throw new Error("No MongoDB URIs available");
  }

  let lastError;

  for (const [index, uri] of candidates.entries()) {
    try {
      const isFallback = index > 0;
      console.log(`Attempting MongoDB connection${isFallback ? " (fallback)" : ""}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`✅ MongoDB connected successfully${isFallback ? " using fallback URI" : ""}`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ Connection attempt ${index + 1} failed:`, error.message);
    }
  }

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
