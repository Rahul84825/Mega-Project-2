import { body, param } from "express-validator";

const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const safeString = (min, max) => ({ min, max });

export const registerValidation = [
  body("name").trim().isLength(safeString(2, 100)).withMessage("Name must be between 2 and 100 characters").escape(),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().withMessage("Password is required").isLength({ min: 8, max: 128 }).withMessage("Password must be at least 8 characters")
];

export const loginValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().withMessage("Password is required").notEmpty().withMessage("Password is required")
];

export const googleAuthValidation = [
  body("idToken").isString().withMessage("Google ID token is required").notEmpty().withMessage("Google ID token is required")
];

export const productValidation = [
  body("name").trim().isLength(safeString(2, 120)).withMessage("Product name is required").escape(),
  body("price").isFloat({ gt: 0 }).withMessage("Price must be a number greater than zero").toFloat(),
  body("category").trim().isLength(safeString(2, 60)).withMessage("Category is required").escape(),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer").toInt(),
  body("image").optional().isURL().withMessage("Image must be a valid URL").trim(),
  body("description").optional().isLength(safeString(0, 500)).withMessage("Description is too long").trim().escape()
];

export const updateProductValidation = [
  body("name").optional().trim().isLength(safeString(2, 120)).withMessage("Product name must be between 2 and 120 characters").escape(),
  body("price").optional().isFloat({ gt: 0 }).withMessage("Price must be a number greater than zero").toFloat(),
  body("category").optional().trim().isLength(safeString(2, 60)).withMessage("Category must be between 2 and 60 characters").escape(),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer").toInt(),
  body("image").optional().isURL().withMessage("Image must be a valid URL").trim(),
  body("description").optional().isLength(safeString(0, 500)).withMessage("Description is too long").trim().escape()
];

export const productIdValidation = [
  param("id").trim().isLength({ min: 1, max: 64 }).withMessage("Invalid product id")
];

export const paymentCreateValidation = [
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than zero").toFloat(),
  body("currency").optional().isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code").toUpperCase(),
  body("receipt").optional().isLength(safeString(1, 80)).withMessage("Receipt is too long").trim().escape()
];

export const paymentVerifyValidation = [
  body("razorpay_order_id").trim().isLength({ min: 1, max: 200 }).withMessage("Missing Razorpay order id").escape(),
  body("razorpay_payment_id").trim().isLength({ min: 1, max: 200 }).withMessage("Missing Razorpay payment id").escape(),
  body("razorpay_signature").trim().isLength({ min: 1, max: 500 }).withMessage("Missing Razorpay signature"),
  body("orderData").optional().isObject().withMessage("orderData must be an object")
];

export const orderCreateValidation = [
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than zero").toFloat(),
  body("customer").optional().isObject().withMessage("customer must be an object"),
  body("items").optional().isArray().withMessage("items must be an array"),
  body("status").optional().isString().trim().isLength(safeString(1, 40)).escape()
];

export const deliveryStatusValidation = [
  body("orderId").trim().matches(mongoIdPattern).withMessage("orderId must be a valid MongoDB id"),
  body("deliveryStatus").isIn(["pending", "out_for_delivery", "delivered"]).withMessage("Invalid delivery status")
];

export const deliveryOtpValidation = [
  body("orderId").trim().matches(mongoIdPattern).withMessage("orderId must be a valid MongoDB id"),
  body("otp").trim().matches(/^\d{4}$/).withMessage("OTP must be a 4-digit code")
];

export const resendDeliveryOtpValidation = [
  body("orderId").trim().matches(mongoIdPattern).withMessage("orderId must be a valid MongoDB id")
];