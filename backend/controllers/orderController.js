import crypto from "crypto";
import Order from "../models/Order.js";
import { getIo } from "../socket.js";
import { sendDeliveryOTP } from "../utils/sendOTP.js";

const DELIVERY_STATUSES = ["pending", "out_for_delivery", "delivered"];
const DELIVERY_OTP_TTL_MINUTES = 15;

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

export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;

    if (!isValidOrderPayload(orderData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order payload"
      });
    }

    orderData._id = orderData._id || Date.now().toString();
    orderData.createdAt = orderData.createdAt || new Date().toISOString();

    const io = getIo();
    if (io) {
      io.emit("newOrder", orderData);
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: orderData
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
      order.deliveryOTP = deliveryOTP;
      order.otpExpiresAt = new Date(Date.now() + DELIVERY_OTP_TTL_MINUTES * 60 * 1000);
      order.deliveryVerified = false;

      await order.save();
      await sendDeliveryOTP(order, deliveryOTP);
    } else if (deliveryStatus === "delivered") {
      order.deliveryVerified = true;
      order.deliveryOTP = undefined;
      order.otpExpiresAt = undefined;
      await order.save();
    } else {
      order.deliveryVerified = false;
      order.deliveryOTP = undefined;
      order.otpExpiresAt = undefined;
      await order.save();
    }

    const io = getIo();
    const sanitizedOrder = sanitizeOrder(order);

    if (io) {
      io.emit("orderUpdated", sanitizedOrder);
    }

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

    const order = await Order.findById(orderId);

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
    await order.save();

    const io = getIo();
    const sanitizedOrder = sanitizeOrder(order);

    if (io) {
      io.emit("orderUpdated", sanitizedOrder);
    }

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
