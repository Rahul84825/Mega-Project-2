import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import { initializeSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI_FALLBACK =
  process.env.MONGODB_URI_FALLBACK || "mongodb://127.0.0.1:27017/mithai_world";

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
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  const connect = async (uri) => {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
  };

  try {
    await connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    const canFallbackToLocal =
      process.env.NODE_ENV !== "production" &&
      MONGODB_URI.startsWith("mongodb+srv://") &&
      MONGODB_URI_FALLBACK;

    if (canFallbackToLocal && /querySrv\s+ECONNREFUSED/i.test(error.message)) {
      console.warn(
        "MongoDB Atlas SRV DNS lookup failed. Falling back to local MongoDB URI for development..."
      );

      try {
        await connect(MONGODB_URI_FALLBACK);
        console.log("MongoDB connected successfully using fallback URI");
        return true;
      } catch (fallbackError) {
        console.error("MongoDB fallback connection failed:", fallbackError.message);
        throw fallbackError;
      }
    }

    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
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
