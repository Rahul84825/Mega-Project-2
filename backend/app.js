import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

const getFrontendOrigin = () => process.env.FRONTEND_URL || "http://localhost:5173";
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// Core HTTP security headers for common vulnerabilities.
app.use(helmet());
app.use(
  cors({
    origin: getFrontendOrigin(),
    credentials: true
  })
);
// Apply basic request throttling to reduce abuse.
app.use(apiLimiter);
// Sanitize request payloads to reduce reflected/stored XSS vectors.
app.use(xss());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint used by frontend and uptime checks.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "mithai-world backend is running"
  });
});

// Modular API route registration.
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productsRoutes);

// Centralized 404 and error serialization.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
