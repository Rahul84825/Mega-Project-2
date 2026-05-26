import { Router } from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon
} from "../controllers/couponController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public: Validate coupon during checkout
router.post("/validate", validateCoupon);

// Admin: Manage coupons
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
