import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getIo } from "../socket.js";
import { sendDeliveryOTP } from "../utils/sendOTP.js";
import { logger } from "../utils/logger.js";

const DELIVERY_STATUSES = ["pending", "out_for_delivery", "delivered"];
const DELIVERY_OTP_TTL_MINUTES = 15;
const OTP_RESEND_MIN_INTERVAL_MS = 30 * 1000;
const OTP_RESEND_MAX_ATTEMPTS = 3;

const isValidOrderPayload = (orderData) => {
  return Boolean(orderData && typeof orderData === "object" && !Array.isArray(orderData));
};

const generateDeliveryOTP = () => crypto.randomInt(1000, 10000).toString();

const sanitizeOrder = (order) => {
  if (!order) {
    return order;
  }

  const plainOrder = typeof order.toObject === "function" ? order.toObject() : { ...order };
  delete plainOrder.deliveryOTP;
  delete plainOrder.otpExpiresAt;
  return plainOrder;
};

const sanitizeOrders = (orders) => orders.map((order) => sanitizeOrder(order));

const getVariantSelection = (item) => {
  const variantIndex = Number.isInteger(Number(item?.variantIndex)) ? Number(item.variantIndex) : null;
  const variantLabel = String(item?.variant?.label || item?.variantLabel || "").trim();
  return { variantIndex, variantLabel };
};

export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    if (!isValidOrderPayload(orderData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order payload"
      });
    }

    const orderItems = Array.isArray(orderData.items) ? orderData.items : [];
    const normalizedOrderItems = [];

    for (const item of orderItems) {
      const productId = item?.productId || item?._id || item?.id;
      const requestedQty = Number(item?.qty || 0);
      const { variantIndex, variantLabel } = getVariantSelection(item);

      if (!productId || !Number.isFinite(requestedQty) || requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item payload"
        });
      }

      const product = await Product.findById(productId).select("name variants");
      const resolvedVariantIndex = variantIndex !== null
        ? variantIndex
        : product?.variants?.findIndex((variant) => String(variant?.label || "").trim() === variantLabel);
      const selectedVariant = Number.isInteger(resolvedVariantIndex) && resolvedVariantIndex >= 0
        ? product?.variants?.[resolvedVariantIndex]
        : null;

      if (!product || !selectedVariant || Number(selectedVariant.stock || 0) < requestedQty) {
        return res.status(409).json({
          success: false,
          message: `${item?.name || product?.name || "Product"} is out of stock or has insufficient quantity`
        });
      }

      normalizedOrderItems.push({ productId, requestedQty, name: product.name, variantIndex: resolvedVariantIndex, variantLabel });
    }

    const createdOrder = await Order.create({
      ...orderData,
      status: orderData.status || "Pending",
      paymentStatus: orderData.paymentStatus || "paid"
    });

    for (const item of normalizedOrderItems) {
      const variantPath = Number.isInteger(item.variantIndex) && item.variantIndex >= 0
        ? `variants.${item.variantIndex}.stock`
        : null;

      if (!variantPath) {
        return res.status(409).json({
          success: false,
          message: `${item.name || "Product"} has an invalid variant selection`
        });
      }

      const stockCheckResult = await Product.updateOne(
        { _id: item.productId, [variantPath]: { $gte: item.requestedQty } },
        { $inc: { [variantPath]: -item.requestedQty } }
      );

      if (stockCheckResult.modifiedCount === 0) {
        return res.status(409).json({
          success: false,
          message: `${item.name || "Product"} went out of stock during checkout`
        });
      }
    }

    const io = getIo();
    if (io) {
      io.emit("newOrder", sanitizeOrder(createdOrder));
    }

    logger.info("Order created", {
      orderId: createdOrder._id
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: sanitizeOrder(createdOrder)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order"
    });
  }
};

export const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders: sanitizeOrders(orders)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders"
    });
  }
};

export const updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (payload.status) {
      order.status = payload.status;
    }

    if (payload.paymentStatus) {
      order.paymentStatus = payload.paymentStatus;
    }

    if (payload.deliveryStatus) {
      order.deliveryStatus = payload.deliveryStatus;
    }

    if (typeof payload.deliveryVerified === "boolean") {
      order.deliveryVerified = payload.deliveryVerified;
    }

    if (payload.status === "delivered" || payload.deliveryStatus === "delivered") {
      order.status = "delivered";
      order.deliveryStatus = "delivered";
      order.deliveryVerified = true;
      order.deliveryOTP = undefined;
      order.otpExpiresAt = undefined;
      order.otpResendCount = 0;
      order.otpLastSentAt = undefined;
    }

    await order.save();

    const io = getIo();
    const sanitizedOrder = sanitizeOrder(order);
    if (io) {
      io.emit("orderUpdated", sanitizedOrder);
    }

    return res.status(200).json({
      success: true,
      order: sanitizedOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order"
    });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, deliveryStatus } = req.body;

    if (!orderId || !deliveryStatus) {
      return res.status(400).json({
        success: false,
        message: "orderId and deliveryStatus are required"
      });
    }

    if (!DELIVERY_STATUSES.includes(deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.deliveryStatus = deliveryStatus;

    if (deliveryStatus === "out_for_delivery") {
      const deliveryOTP = generateDeliveryOTP();
      const now = new Date();
      order.deliveryOTP = deliveryOTP;
      order.otpExpiresAt = new Date(Date.now() + DELIVERY_OTP_TTL_MINUTES * 60 * 1000);
      order.otpResendCount = 0;
      order.otpLastSentAt = now;
      order.deliveryVerified = false;

      await order.save();
      await sendDeliveryOTP(order, deliveryOTP);
      logger.info("Delivery OTP generated", {
        orderId: String(order._id)
      });
    } else if (deliveryStatus === "delivered") {
      order.deliveryVerified = true;
      order.deliveryOTP = undefined;
      order.otpExpiresAt = undefined;
      order.otpResendCount = 0;
      order.otpLastSentAt = undefined;
      await order.save();
    } else {
      order.deliveryVerified = false;
      order.deliveryOTP = undefined;
      order.otpExpiresAt = undefined;
      order.otpResendCount = 0;
      order.otpLastSentAt = undefined;
      await order.save();
    }

    const io = getIo();
    const sanitizedOrder = sanitizeOrder(order);

    if (io) {
      io.emit("orderUpdated", sanitizedOrder);
    }

    logger.info("Delivery status updated", {
      orderId: String(order._id),
      deliveryStatus
    });

    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      order: sanitizedOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update delivery status"
    });
  }
};

export const verifyDeliveryOTP = async (req, res) => {
  try {
    const { orderId, otp } = req.body;

    if (!orderId || !otp) {
      return res.status(400).json({
        success: false,
        message: "orderId and otp are required"
      });
    }

    const order = await Order.findById(orderId).select("+deliveryOTP +otpExpiresAt");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.deliveryOTP || !order.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No active delivery OTP found for this order"
      });
    }

    if (new Date() > new Date(order.otpExpiresAt)) {
      order.deliveryOTP = undefined;
      order.otpExpiresAt = undefined;
      order.deliveryVerified = false;
      order.otpResendCount = 0;
      order.otpLastSentAt = undefined;
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Delivery OTP has expired"
      });
    }

    if (String(order.deliveryOTP) !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery OTP"
      });
    }

    order.deliveryVerified = true;
    order.deliveryStatus = "delivered";
    order.deliveryOTP = undefined;
    order.otpExpiresAt = undefined;
    order.otpResendCount = 0;
    order.otpLastSentAt = undefined;
    await order.save();

    const io = getIo();
    const sanitizedOrder = sanitizeOrder(order);

    if (io) {
      io.emit("orderUpdated", sanitizedOrder);
    }

    logger.info("Delivery OTP verified", {
      orderId: String(order._id)
    });

    return res.status(200).json({
      success: true,
      message: "Delivery OTP verified successfully",
      order: sanitizedOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify delivery OTP"
    });
  }
};

export const resendDeliveryOTP = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    const order = await Order.findById(orderId).select("+deliveryOTP +otpExpiresAt");

    if (!order) {
      logger.warn("Delivery OTP resend failed: order not found", { orderId });
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.deliveryStatus !== "out_for_delivery") {
      logger.warn("Delivery OTP resend denied: invalid order state", {
        orderId: String(order._id),
        deliveryStatus: order.deliveryStatus
      });
      return res.status(400).json({
        success: false,
        message: "Delivery OTP can only be resent when order is out for delivery"
      });
    }

    if ((order.otpResendCount || 0) >= OTP_RESEND_MAX_ATTEMPTS) {
      logger.warn("Delivery OTP resend denied: max attempts reached", {
        orderId: String(order._id),
        otpResendCount: order.otpResendCount || 0
      });
      return res.status(429).json({
        success: false,
        message: "Maximum resend attempts reached"
      });
    }

    if (order.otpLastSentAt) {
      const elapsedMs = Date.now() - new Date(order.otpLastSentAt).getTime();
      if (elapsedMs < OTP_RESEND_MIN_INTERVAL_MS) {
        logger.warn("Delivery OTP resend denied: cooldown active", {
          orderId: String(order._id),
          elapsedMs
        });
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting OTP again"
        });
      }
    }

    const deliveryOTP = generateDeliveryOTP();
    const now = new Date();
    order.deliveryOTP = deliveryOTP;
    order.otpExpiresAt = new Date(now.getTime() + DELIVERY_OTP_TTL_MINUTES * 60 * 1000);
    order.otpResendCount = (order.otpResendCount || 0) + 1;
    order.otpLastSentAt = now;
    order.deliveryVerified = false;
    await order.save();

    await sendDeliveryOTP(order, deliveryOTP);
    logger.info("Delivery OTP resent", {
      orderId: String(order._id),
      otpResendCount: order.otpResendCount
    });

    const io = getIo();
    const sanitizedOrder = sanitizeOrder(order);

    if (io) {
      io.emit("orderUpdated", sanitizedOrder);
    }

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      order: sanitizedOrder
    });
  } catch (error) {
    logger.error("Delivery OTP resend failed", {
      message: error.message
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to resend delivery OTP"
    });
  }
};
