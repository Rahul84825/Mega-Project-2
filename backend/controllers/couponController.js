import Coupon from "../models/Coupon.js";
import { logger } from "../utils/logger.js";

/**
 * Validate a coupon code
 * POST /api/coupons/validate
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    const validation = coupon.isValid(orderAmount);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    return res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        calculatedDiscount: Math.round(discount)
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Get all coupons
 * GET /api/coupons
 */
export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Create a coupon
 * POST /api/coupons
 */
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt, usageLimit, description } = req.body;

    const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiresAt: new Date(expiresAt),
      usageLimit,
      description
    });

    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Delete a coupon
 * DELETE /api/coupons/:id
 */
export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    return next(error);
  }
};
