import { Router } from "express";
import { getOrders, updateDeliveryStatus, verifyDeliveryOTP } from "../controllers/orderController.js";

const router = Router();

router.get("/", getOrders);
router.post("/verify-delivery", verifyDeliveryOTP);
router.patch("/delivery-status", updateDeliveryStatus);

export default router;