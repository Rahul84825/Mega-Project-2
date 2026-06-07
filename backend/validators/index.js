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
  body("gstPercent").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("GST must be between 0 and 100").toFloat(),
  body("variants").optional().isArray({ min: 1 }).withMessage("Variants must be a non-empty array"),
  body("variants.*.label").optional().trim().isLength(safeString(1, 30)).withMessage("Variant label is required"),
  body("variants.*.mrp").optional().isInt({ min: 1 }).withMessage("Variant MRP must be a whole number").toInt(),
  body("variants.*.discountPercent").optional().isFloat({ min: 0, max: 100 }).withMessage("Variant discount must be between 0 and 100").toFloat(),
  body("variants.*.sellingPrice").optional().isInt({ min: 1 }).withMessage("Variant selling price must be a whole number").toInt(),
  body("variants.*.stock").optional().isInt({ min: 0 }).withMessage("Variant stock must be a non-negative integer").toInt(),
  body("category").trim().matches(/^[a-z0-9-]{1,80}$/).withMessage("Category must be a valid slug"),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer").toInt(),
  body("image").optional({ checkFalsy: true }).isURL().withMessage("Image must be a valid URL").trim(),
  body("description").optional().isLength(safeString(0, 500)).withMessage("Description is too long").trim().escape()
];

export const updateProductValidation = [
  body("name").optional().trim().isLength(safeString(2, 120)).withMessage("Product name must be between 2 and 120 characters").escape(),
  body("gstPercent").optional().isFloat({ min: 0, max: 100 }).withMessage("GST must be between 0 and 100").toFloat(),
  body("variants").optional().isArray({ min: 1 }).withMessage("Variants must be a non-empty array"),
  body("variants.*.label").optional().trim().isLength(safeString(1, 30)).withMessage("Variant label is required"),
  body("variants.*.mrp").optional().isInt({ min: 1 }).withMessage("Variant MRP must be a whole number").toInt(),
  body("variants.*.discountPercent").optional().isFloat({ min: 0, max: 100 }).withMessage("Variant discount must be between 0 and 100").toFloat(),
  body("variants.*.sellingPrice").optional().isInt({ min: 1 }).withMessage("Variant selling price must be a whole number").toInt(),
  body("variants.*.stock").optional().isInt({ min: 0 }).withMessage("Variant stock must be a non-negative integer").toInt(),
  body("category").optional().trim().matches(/^[a-z0-9-]{1,80}$/).withMessage("Category must be a valid slug"),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer").toInt(),
  body("image").optional({ checkFalsy: true }).isURL().withMessage("Image must be a valid URL").trim(),
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
  body("razorpay_order_id").trim().isLength({ min: 1, max: 200 }).withMessage("Missing Razorpay order id").notEmpty().withMessage("Razorpay order id cannot be empty"),
  body("razorpay_payment_id").trim().isLength({ min: 1, max: 200 }).withMessage("Missing Razorpay payment id").notEmpty().withMessage("Razorpay payment id cannot be empty"),
  body("razorpay_signature").trim().isLength({ min: 1, max: 500 }).withMessage("Missing Razorpay signature").notEmpty().withMessage("Razorpay signature cannot be empty"),
  body("orderData").optional().isObject().withMessage("orderData must be an object")
];

export const orderCreateValidation = [
  // Required: amount > 0
  body("amount")
    .exists({ checkFalsy: false })
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than zero")
    .toFloat(),
  
  // Optional: customer info (can be guest checkout)
  body("customer")
    .optional()
    .isObject()
    .withMessage("customer must be an object"),
  
  // Optional: items array (can be populated during order creation)
  body("items")
    .optional()
    .isArray({ min: 1 })
    .withMessage("items must be a non-empty array"),
  
  // Optional: custom status
  body("status")
    .optional()
    .isString()
    .trim()
    .isLength(safeString(1, 40))
    .escape(),

  // Optional: currency (defaults to INR)
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code")
    .toUpperCase(),

  // Optional: payment method info
  body("payment")
    .optional()
    .isObject()
    .withMessage("payment must be an object"),

  // Optional: shipping address
  body("shippingAddress")
    .optional()
    .isObject()
    .withMessage("shippingAddress must be an object"),

  // Optional: pricing totals
  body("totals")
    .optional()
    .isObject()
    .withMessage("totals must be an object")
];

export const deliveryStatusValidation = [
  body("orderId").trim().matches(mongoIdPattern).withMessage("orderId must be a valid MongoDB id"),
  body("deliveryStatus").isIn(["pending", "out_for_delivery", "delivered"]).withMessage("Invalid delivery status")
];

export const categoryCreateValidation = [
  body("name").trim().isLength(safeString(2, 60)).withMessage("Category name must be between 2 and 60 characters"),
  body("is_active").optional().isBoolean().withMessage("is_active must be a boolean").toBoolean(),
  body("showInNavbar").optional().isBoolean().withMessage("showInNavbar must be a boolean").toBoolean(),
  body("showInHomepage").optional().isBoolean().withMessage("showInHomepage must be a boolean").toBoolean(),
  body("type").optional().trim().toLowerCase().isIn(["sweets", "other"]).withMessage("type must be one of: sweets, other"),
  body("order").optional().isInt({ min: 0 }).withMessage("order must be a non-negative integer").toInt()
];

export const categoryUpdateValidation = [
  body("name").optional().trim().isLength(safeString(2, 60)).withMessage("Category name must be between 2 and 60 characters"),
  body("is_active").optional().isBoolean().withMessage("is_active must be a boolean").toBoolean(),
  body("showInNavbar").optional().isBoolean().withMessage("showInNavbar must be a boolean").toBoolean(),
  body("showInHomepage").optional().isBoolean().withMessage("showInHomepage must be a boolean").toBoolean(),
  body("type").optional().trim().toLowerCase().isIn(["sweets", "other"]).withMessage("type must be one of: sweets, other"),
  body("order").optional().isInt({ min: 0 }).withMessage("order must be a non-negative integer").toInt()
];

export const categoryIdValidation = [
  param("id")
    .trim()
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid category id")
];