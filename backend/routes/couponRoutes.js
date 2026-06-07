import { Router } from "express";
import {
  validateCoupon,
  getCoupons,
  getAvailableCoupons,
  createCoupon,
  deleteCoupon
} from "../controllers/couponController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public: Validate coupon during checkout
router.post("/validate", validateCoupon);

// Public: Get visible coupons for checkout discovery
router.get("/available", getAvailableCoupons);

// Admin: Manage coupons
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
