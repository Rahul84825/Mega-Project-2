import { Router } from "express";
import { getOrders, resendDeliveryOTP, updateDeliveryStatus, updateOrderById, verifyDeliveryOTP } from "../controllers/orderController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { otpLimiter, otpResendLimiter } from "../middleware/rateLimiters.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
	deliveryOtpValidation,
	deliveryStatusValidation,
	orderCreateValidation,
	resendDeliveryOtpValidation
} from "../validators/index.js";
import { createOrder } from "../controllers/orderController.js";

const router = Router();

router.get("/", getOrders);
router.post("/", orderCreateValidation, validateRequest, createOrder);
router.put("/:id", protect, adminOnly, updateOrderById);
router.patch("/:id", protect, adminOnly, updateOrderById);
router.post("/verify-delivery", otpLimiter, deliveryOtpValidation, validateRequest, verifyDeliveryOTP);
router.post("/resend-otp", otpResendLimiter, resendDeliveryOtpValidation, validateRequest, resendDeliveryOTP);
router.patch("/delivery-status", protect, adminOnly, deliveryStatusValidation, validateRequest, updateDeliveryStatus);

export default router;