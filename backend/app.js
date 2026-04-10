import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { sanitizeRequestData } from "./middleware/requestSanitizer.js";

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
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
// Strip dangerous MongoDB operators and normalize raw input before validation.
app.use(sanitizeRequestData);
// Sanitize request payloads to reduce reflected/stored XSS vectors.
app.use(xss());

// Health endpoint used by frontend and uptime checks.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "mithai-world backend is running"
  });
});

// Modular API route registration.
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productsRoutes);

// Centralized 404 and error serialization.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
