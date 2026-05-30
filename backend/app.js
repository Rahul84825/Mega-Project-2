import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import xss from "xss-clean";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import heroSlideRoutes from "./routes/heroSlideRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import User from "./models/User.js";
import { adminOnly, protect } from "./middleware/authMiddleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { sanitizeRequestData } from "./middleware/requestSanitizer.js";
import { logger } from "./utils/logger.js";

const app = express();

const getFrontendOrigin = () => {
  const url = process.env.FRONTEND_URL || "http://localhost:5173";
  return url.replace(/\/$/, "");
};

// --- CORS Configuration ---
const allowedOrigins = [
  getFrontendOrigin(),
  "https://mithaipune.com",
  "https://www.mithaipune.com",
  "http://mithaipune.com",
  "http://www.mithaipune.com",
  "https://mithaiworld.vercel.app",
  "https://mega-project-2.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
};

const getAllowedScriptOrigins = () => [
  "'self'",
  "https://accounts.google.com",
  "https://accounts.googleusercontent.com",
  "https://checkout.razorpay.com"
];

/**
 * SECURITY: Helmet - Sets various HTTP headers for security
 * Protects against: XSS, Clickjacking, MIME type sniffing, etc.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: getAllowedScriptOrigins(),
      connectSrc: ["'self'", "https://accounts.google.com", "https://accounts.googleusercontent.com", "https://checkout.razorpay.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

/**
 * SECURITY: CORS with strict configuration
 * Prevents requests from unauthorized origins
 */
app.use(cors(corsOptions));

app.set("trust proxy", 1);

/**
 * RATE LIMITING CONFIGURATION
 * Different limits for different types of endpoints
 */

// Global API rate limiter (applied to all requests)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min (20 req/min average)
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later",
  skip: (req) => req.path === "/api/health" // Don't count health checks
});

// Strict rate limiter for authentication endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true // Don't count successful requests
});

// Moderate rate limiter for product/category endpoints
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" // Only apply to non-GET
});

// Apply global limiter to all requests
app.use(globalLimiter);

/**
 * PARSING & VALIDATION
 */
app.use(express.json({ limit: "10kb" })); // Reduced from 20kb for security
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/**
 * SECURITY: Input Sanitization
 * Sanitizes MongoDB operators and normalizes raw input before validation
 */
app.use(sanitizeRequestData);

/**
 * SECURITY: XSS Protection
 * Sanitizes request payloads to reduce reflected/stored XSS vectors
 */
app.use(xss());

/**
 * PRODUCTION LOGGING
 * Logs all incoming requests (disabled in dev for clarity)
 */
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent")
    });
    next();
  });
}

/**
 * DEVELOPMENT API REQUEST LOGGING
 * Logs all API requests in development for debugging
 */
if (process.env.NODE_ENV !== "production") {
  app.use("/api", (req, res, next) => {
    console.log(`📡 [API] ${req.method.toUpperCase()} ${req.path}`);
    if (Object.keys(req.body).length > 0) {
      console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
    }
    next();
  });
}

/**
 * HEALTH CHECK ENDPOINT
 * Used by frontend and monitoring services
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "mithai-world backend is running",
    timestamp: new Date().toISOString()
  });
});

/**
 * MODULAR API ROUTE REGISTRATION
 * Each route group has rate limiting applied appropriately
 */

// Authentication routes (strict rate limiting)
app.use("/api/auth", authLimiter, authRoutes);

// Payment debugging middleware (logs all payment requests in detail)
app.use("/api/payment", (req, res, next) => {
  if (req.method === "POST") {
    logger.info("🔵 PAYMENT REQUEST RECEIVED", {
      endpoint: req.path,
      method: req.method,
      bodyKeys: Object.keys(req.body),
      hasRazorpayOrderId: !!req.body?.razorpay_order_id,
      hasRazorpayPaymentId: !!req.body?.razorpay_payment_id,
      hasRazorpaySignature: !!req.body?.razorpay_signature,
      hasOrderData: !!req.body?.orderData,
      timestamp: new Date().toISOString()
    });

    if (req.path === "/verify") {
      logger.info("🔐 PAYMENT VERIFY REQUEST DETAILS", {
        razorpayOrderId: req.body?.razorpay_order_id,
        razorpayPaymentId: req.body?.razorpay_payment_id,
        signatureProvided: req.body?.razorpay_signature,
        orderDataCustomer: req.body?.orderData?.customer?.name,
        orderDataItemCount: Array.isArray(req.body?.orderData?.items) ? req.body.orderData.items.length : 0,
        orderDataAmount: req.body?.orderData?.amount
      });
    }
  }
  next();
});

// Payment routes (global limiter + read limiter)
app.use("/api/payment", readLimiter, paymentRoutes);

// Order routes (moderate rate limiting)
app.use("/api/orders", readLimiter, orderRoutes);

// Product routes (general rate limiting)
app.use("/api/products", productsRoutes);

// Category routes (general rate limiting)
app.use("/api/categories", categoryRoutes);

// Offer routes (general rate limiting)
app.use("/api/offers", offerRoutes);

// Hero slide routes (general rate limiting)
app.use("/api/hero-slides", heroSlideRoutes);

// Contact routes
app.use("/api/contact", contactRoutes);

// Newsletter routes
app.use("/api/newsletter", newsletterRoutes);

// Upload routes (strict for file security)
app.use("/api/upload", rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many file uploads"
}), uploadRoutes);

// Debug routes (development/debugging only)
app.use("/api/debug", debugRoutes);

// Admin reporting routes
app.use("/api/reports", reportRoutes);

// Delivery routes (webhooks)
app.use("/api/delivery", deliveryRoutes);

// Coupon routes
app.use("/api/coupons", couponRoutes);

/**
 * ERROR HANDLING
 * Centralized 404 and error serialization
 * Must be defined AFTER all routes
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
