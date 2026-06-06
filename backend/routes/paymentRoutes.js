import { Router } from "express";
import { createPaymentOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { paymentCreateValidation, paymentVerifyValidation } from "../validators/index.js";

const router = Router();

router.post("/create-order", protect, paymentCreateValidation, validateRequest, createPaymentOrder);
router.post("/verify", protect, paymentVerifyValidation, validateRequest, verifyPayment);

export default router;