import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getIo } from "../socket.js";
import { logger } from "../utils/logger.js";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};

const normalizeAmountToPaise = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  return Math.round(numericAmount * 100);
};

const isPlainObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));

const extractOrderData = (body) => {
  if (isPlainObject(body?.orderData)) {
    return body.orderData;
  }

  if (isPlainObject(body?.order)) {
    return body.order;
  }

  if (isPlainObject(body)) {
    const { amount, currency, receipt, razorpay_order_id, razorpay_payment_id, razorpay_signature, ...orderData } = body;
    return orderData;
  }

  return {};
};

const sanitizeOrderPayload = (orderData) => {
  const sanitizedOrderData = { ...orderData };
  delete sanitizedOrderData.deliveryStatus;
  delete sanitizedOrderData.deliveryOTP;
  delete sanitizedOrderData.otpExpiresAt;
  delete sanitizedOrderData.deliveryVerified;
  return sanitizedOrderData;
};

export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    const amountInPaise = normalizeAmountToPaise(amount);

    if (!amountInPaise) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required"
      });
    }

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`
    });

    logger.info("Razorpay order created", {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order"
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orderData = extractOrderData(req.body);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment fields"
      });
    }

    if (!isPlainObject(orderData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data"
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "Payment already processed"
      });
    }

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);

    if (!razorpayOrder || razorpayOrder.id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Unable to validate Razorpay order"
      });
    }

    const orderItems = Array.isArray(orderData.items) ? orderData.items : [];
    const normalizedOrderItems = [];

    for (const item of orderItems) {
      const productId = item?.productId || item?._id || item?.id;
      const requestedQty = Number(item?.qty || 0);

      if (!productId || !Number.isFinite(requestedQty) || requestedQty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item payload"
        });
      }

      const product = await Product.findById(productId).select("name stock");
      if (!product || product.stock < requestedQty) {
        return res.status(409).json({
          success: false,
          message: `${item?.name || product?.name || "Product"} is out of stock or has insufficient quantity`
        });
      }

      normalizedOrderItems.push({ productId, requestedQty, name: product.name });
    }

    const createdOrder = await Order.create({
      ...sanitizeOrderPayload(orderData),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || orderData.currency || "INR",
      status: orderData.status || "Pending",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      metadata: {
        razorpayOrderStatus: razorpayOrder.status,
        ...orderData.metadata
      }
    });

    for (const item of normalizedOrderItems) {
      const stockUpdate = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.requestedQty } },
        { $inc: { stock: -item.requestedQty } }
      );

      if (stockUpdate.modifiedCount === 0) {
        return res.status(409).json({
          success: false,
          message: `${item.name || "Product"} went out of stock during checkout`
        });
      }
    }

    await Product.updateMany(
      { stock: { $lte: 0 } },
      { $set: { inStock: false, stock: 0 } }
    );

    await Product.updateMany(
      { stock: { $gt: 0 } },
      { $set: { inStock: true } }
    );

    const io = getIo();
    if (io) {
      io.emit("newOrder", createdOrder.toObject());
    }

    logger.info("Payment verified and order created", {
      orderId: createdOrder._id,
      razorpayOrderId: razorpay_order_id
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and order created successfully",
      order: createdOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment"
    });
  }
};