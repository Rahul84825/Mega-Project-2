import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

/**
 * SECURITY: JWT Verification Middleware
 * Verifies JWT token and extracts user information
 * Prevents unauthorized access to protected endpoints
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid authorization header", {
        path: req.originalUrl,
        method: req.method
      });
      return res.status(401).json({
        success: false,
        message: "Not authorized - missing token"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - empty token"
      });
    }

    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to request
    req.user = {
      userId: decoded.userId,
      isAdmin: Boolean(decoded.isAdmin === true)
    };

    logger.debug(`User authenticated: ${decoded.userId}`, { userId: decoded.userId });
    return next();
  } catch (error) {
    // Log different error types for debugging
    if (error.name === "TokenExpiredError") {
      logger.warn("Token expired", { errorName: error.name });
      return res.status(401).json({
        success: false,
        message: "Token expired, please login again"
      });
    }

    if (error.name === "JsonWebTokenError") {
      logger.warn("Invalid token", { errorName: error.name });
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    logger.error("Authentication error", {
      errorName: error.name,
      errorMessage: error.message
    });

    return res.status(401).json({
      success: false,
      message: "Token invalid or expired"
    });
  }
};

/**
 * SECURITY: Admin-Only Middleware
 * Ensures user has admin privileges
 * HARDENED: Now strictly checks isAdmin flag (no implicit trust)
 */
export const adminOnly = (req, res, next) => {
  // First check: user must exist (protect middleware already verified)
  if (!req.user) {
    logger.warn("Admin access attempted without user context", {
      path: req.originalUrl
    });
    return res.status(401).json({
      success: false,
      message: "Not authorized"
    });
  }

  // Second check: isAdmin must be explicitly true (not just truthy)
  if (req.user.isAdmin !== true) {
    logger.warn("Unauthorized admin access attempt", {
      userId: req.user.userId,
      isAdmin: req.user.isAdmin,
      path: req.originalUrl,
      method: req.method
    });

    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }

  logger.debug(`Admin access granted to: ${req.user.userId}`, {
    userId: req.user.userId
  });

  return next();
};

/**
 * Alias for adminOnly (for consistency)
 */
export const requireAdmin = adminOnly;
