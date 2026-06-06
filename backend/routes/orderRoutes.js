import { Router } from "express";
import {
	acceptOrder,
	getOrdersByStatus,
	getSingleOrder,
	markDelivered,
	markPickedUp,
	markPreparing,
	markReadyForPickup,
	placeOrder,
	rejectOrder,
	getMyOrders
} from "../controllers/orderController.js";
import { adminOnly, protect, optionalProtect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { orderCreateValidation } from "../validators/index.js";

const router = Router();

router.get("/", protect, adminOnly, getOrdersByStatus);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, adminOnly, getSingleOrder);
router.post("/", protect, orderCreateValidation, validateRequest, placeOrder);
router.patch("/:id/accept", protect, adminOnly, acceptOrder);
router.patch("/:id/reject", protect, adminOnly, rejectOrder);
router.patch("/:id/preparing", protect, adminOnly, markPreparing);
router.patch("/:id/ready", protect, adminOnly, markReadyForPickup);
router.patch("/:id/picked-up", protect, adminOnly, markPickedUp);
router.patch("/:id/delivered", protect, adminOnly, markDelivered);

export default router;