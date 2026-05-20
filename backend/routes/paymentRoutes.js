import { Router } from "express";
import { createPaymentOrder, verifyPayment } from "../controllers/paymentController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { paymentCreateValidation, paymentVerifyValidation } from "../validators/index.js";

const router = Router();

router.post("/create-order", paymentCreateValidation, validateRequest, createPaymentOrder);
router.post("/verify", optionalProtect, paymentVerifyValidation, validateRequest, verifyPayment);

export default router;