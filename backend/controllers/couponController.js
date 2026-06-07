import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import { logger } from "../utils/logger.js";

/**
 * Validate a coupon code
 * POST /api/coupons/validate
 */
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount, userId } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    // ── PER-USER USAGE CHECK ──
    let userUsedCoupons = [];
    if (userId) {
      // Find all successful orders by this user that used this specific coupon
      const ordersWithCoupon = await Order.find({
        "customer.userId": userId,
        "coupon.code": coupon.code,
        status: { $ne: "REJECTED" } // Don't count rejected orders
      }).select("coupon.code");
      
      userUsedCoupons = ordersWithCoupon.map(o => o.coupon.code);
    }

    const validation = coupon.isValid(orderAmount, userId, userUsedCoupons);
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
 * Public: Get coupons visible on checkout
 * GET /api/coupons/available
 */
export const getAvailableCoupons = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    let query = {
      isActive: true,
      showOnCheckout: true,
      expiresAt: { $gt: new Date() }
    };

    if (userId) {
      // Find coupons already used by this user
      const usedCoupons = await Order.find({
        "customer.userId": userId,
        status: { $ne: "REJECTED" },
        "coupon.code": { $exists: true }
      }).distinct("coupon.code");

      if (usedCoupons.length > 0) {
        query.code = { $nin: usedCoupons };
      }
    }

    const coupons = await Coupon.find(query)
    .select("code description discountType discountValue minOrderAmount maxDiscount")
    .sort({ createdAt: -1 });

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
    const { 
      code, 
      discountType, 
      discountValue, 
      minOrderAmount, 
      maxDiscount, 
      expiresAt, 
      usageLimit, 
      description,
      showOnCheckout 
    } = req.body;

    const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    // Ensure expiry is at the end of the selected day
    const expiryDate = new Date(expiresAt);
    expiryDate.setHours(23, 59, 59, 999);

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiresAt: expiryDate,
      usageLimit,
      description,
      showOnCheckout: Boolean(showOnCheckout)
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
