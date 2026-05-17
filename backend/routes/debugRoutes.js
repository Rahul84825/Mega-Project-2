import { Router } from "express";
import { logger } from "../utils/logger.js";
import { adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * DEBUG ENDPOINT: Check Razorpay Configuration
 * Only accessible to admins
 * Returns environment variable status (without sensitive values)
 */
router.get("/razorpay-config", (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const frontendUrl = process.env.FRONTEND_URL;

    logger.info("🔍 DEBUG - Razorpay config check requested");

    return res.status(200).json({
      success: true,
      config: {
        hasRazorpayKeyId: !!keyId,
        razorpayKeyIdLength: keyId?.length || 0,
        razorpayKeyIdPrefix: keyId ? keyId.substring(0, 10) + "..." : "MISSING",
        hasRazorpayKeySecret: !!keySecret,
        razorpayKeySecretLength: keySecret?.length || 0,
        razorpayKeySecretPrefix: keySecret ? keySecret.substring(0, 10) + "..." : "MISSING",
        frontendUrl: frontendUrl || "NOT_SET (using default: http://localhost:5173)",
        nodeEnv: process.env.NODE_ENV || "production",
        mongoDbUri: process.env.MONGODB_URI ? "SET" : "NOT_SET"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error("❌ Debug config check failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
