import { validationResult } from "express-validator";
import { logger } from "../utils/logger.js";

export const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));

  // Enhanced logging for debugging
  logger.warn("❌ Validation failed", {
    path: req.originalUrl,
    method: req.method,
    errorCount: errors.length,
    errors,
    requestBodyKeys: Object.keys(req.body || {}),
    receivedBody: req.body
  });

  // Special debug logging for amount field
  if (errors.some(e => e.field === 'amount')) {
    logger.debug("💰 AMOUNT VALIDATION DEBUG", {
      sentAmount: req.body?.amount,
      amountType: typeof req.body?.amount,
      amountValue: req.body?.amount,
      hasAmount: 'amount' in req.body,
      bodyKeys: Object.keys(req.body || {})
    });
  }

  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors
  });
};