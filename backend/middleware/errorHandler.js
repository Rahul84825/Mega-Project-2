import { logger } from "../utils/logger.js";

const notFoundHandler = (req, res, _next) => {
  logger.warn("Route not found", {
    method: req.method,
    path: req.originalUrl
  });

  res.status(404).json({
    success: false,
    message: "Route not found"
  });
};

const errorHandler = (error, req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = error.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  const message = error.isOperational
    ? error.message
    : isProduction
      ? "Internal Server Error"
      : error.message || "Internal Server Error";

  logger.error("Request failed", {
    method: req?.method,
    path: req?.originalUrl,
    statusCode,
    message,
    stack: isProduction ? undefined : error.stack
  });

  const payload = {
    success: false,
    message
  };

  if (!isProduction && error.stack) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

export { errorHandler, notFoundHandler };
