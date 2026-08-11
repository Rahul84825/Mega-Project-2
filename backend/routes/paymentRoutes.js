import { Router } from "express";
import { createPaymentOrder, verifyPayment, handleRazorpayWebhook } from "../controllers/paymentController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { paymentCreateValidation, paymentVerifyValidation } from "../validators/index.js";

const router = Router();

router.post("/create-order", protect, paymentCreateValidation, validateRequest, createPaymentOrder);
router.post("/verify", optionalProtect, paymentVerifyValidation, validateRequest, verifyPayment);
router.post("/webhook", handleRazorpayWebhook);
router.get("/webhook", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mithai World Razorpay Webhook is active (accepts POST requests only)"
  });
});

export default router;