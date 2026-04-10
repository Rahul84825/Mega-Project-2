import { validationResult } from "express-validator";
import { logger } from "../utils/logger.js";

export const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg
  }));

  logger.warn("Validation failed", {
    path: req.originalUrl,
    method: req.method,
    errors
  });

  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors
  });
};