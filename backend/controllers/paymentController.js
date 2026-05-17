import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { getIo } from "../socket.js";
import { logger } from "../utils/logger.js";
import generateOrderId from "../utils/orderIdGenerator.js";
import { InventoryError, reserveStock } from "../services/inventoryService.js";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  logger.info("🔑 RAZORPAY CLIENT INITIALIZATION", {
    hasKeyId: !!keyId,
    keyIdLength: keyId?.length || 0,
    keyIdPrefix: keyId ? keyId.substring(0, 8) : "MISSING",
    hasKeySecret: !!keySecret,
    keySecretLength: keySecret?.length || 0,
    keySecretPrefix: keySecret ? keySecret.substring(0, 8) : "MISSING"
  });

  if (!keyId || !keySecret) {
    const missingKeys = [];
    if (!keyId) missingKeys.push("RAZORPAY_KEY_ID");
    if (!keySecret) missingKeys.push("RAZORPAY_KEY_SECRET");
    
    const errorMsg = `Missing Razorpay credentials: ${missingKeys.join(", ")}`;
    logger.error("❌ " + errorMsg);
    throw new Error(errorMsg);
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

export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    logger.info("📝 Payment order creation initiated", {
      receivedAmount: amount,
      currency: currency,
      receipt: receipt,
      timestamp: new Date().toISOString()
    });

    const amountInPaise = normalizeAmountToPaise(amount);

    if (!amountInPaise) {
      logger.warn("❌ Invalid amount provided", {
        amount: amount,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        success: false,
        message: "A valid amount is required"
      });
    }

    logger.info("💰 Amount normalized to paise", {
      amountINR: amount,
      amountPaise: amountInPaise
    });

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`
    });

    logger.info("✅ Razorpay order created successfully", {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: razorpayOrder.status,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    logger.error("❌ Failed to create Razorpay order", {
      errorMessage: error.message,
      errorCode: error.code,
      receivedPayload: req.body,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
      errorCode: error.code
    });
  }
};

export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orderData = extractOrderData(req.body);

    logger.info("🔐 PAYMENT VERIFICATION INITIATED", {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      bodyKeys: Object.keys(req.body),
      orderDataKeys: Object.keys(orderData),
      itemCount: Array.isArray(orderData?.items) ? orderData.items.length : 0,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.warn("❌ MISSING PAYMENT FIELDS", {
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature,
        receivedBody: Object.keys(req.body)
      });
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment fields",
        details: {
          hasOrderId: !!razorpay_order_id,
          hasPaymentId: !!razorpay_payment_id,
          hasSignature: !!razorpay_signature
        }
      });
    }

    if (!isPlainObject(orderData)) {
      logger.warn("❌ INVALID ORDER DATA FORMAT", { 
        orderData,
        type: typeof orderData,
        isArray: Array.isArray(orderData)
      });
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
        details: {
          orderDataType: typeof orderData,
          isArray: Array.isArray(orderData)
        }
      });
    }

    // Verify signature
    const verificationString = `${razorpay_order_id}|${razorpay_payment_id}`;
    logger.info("🔐 CALCULATING HMAC SIGNATURE", {
      verificationString: verificationString,
      keySecretLength: process.env.RAZORPAY_KEY_SECRET?.length || 0,
      keySecretExists: !!process.env.RAZORPAY_KEY_SECRET
    });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(verificationString)
      .digest("hex");

    const signatureMatches = expectedSignature === razorpay_signature;
    
    logger.info("🔐 SIGNATURE VERIFICATION RESULT", {
      received: razorpay_signature,
      expected: expectedSignature,
      matches: signatureMatches,
      receivedLength: razorpay_signature.length,
      expectedLength: expectedSignature.length
    });

    if (!signatureMatches) {
      logger.error("❌ SIGNATURE VERIFICATION FAILED - MISMATCH DETECTED", {
        received: razorpay_signature,
        expected: expectedSignature,
        verificationString: verificationString,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature - verification failed",
        details: {
          reason: "Signature mismatch",
          received: razorpay_signature,
          expected: expectedSignature
        }
      });
    }

    logger.info("✅ SIGNATURE VERIFIED SUCCESSFULLY");

    // Check if payment already processed
    const existingOrder = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrder) {
      logger.warn("⚠️ PAYMENT ALREADY PROCESSED", { 
        existingOrderId: existingOrder._id,
        razorpayPaymentId: razorpay_payment_id
      });
      return res.status(409).json({
        success: false,
        message: "Payment already processed",
        order: existingOrder
      });
    }

    // Fetch and validate Razorpay order
    logger.info("🔍 FETCHING RAZORPAY ORDER DETAILS", { razorpayOrderId: razorpay_order_id });
    
    const razorpay = getRazorpayClient();
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
      logger.info("✅ RAZORPAY ORDER FETCHED", { 
        orderId: razorpayOrder.id,
        status: razorpayOrder.status,
        amount: razorpayOrder.amount
      });
    } catch (razorpayFetchError) {
      logger.error("❌ FAILED TO FETCH RAZORPAY ORDER", {
        razorpayOrderId: razorpay_order_id,
        error: razorpayFetchError.message,
        status: razorpayFetchError.statusCode
      });
      return res.status(400).json({
        success: false,
        message: "Unable to validate Razorpay order",
        details: razorpayFetchError.message
      });
    }

    if (!razorpayOrder || razorpayOrder.id !== razorpay_order_id) {
      logger.error("❌ RAZORPAY ORDER VALIDATION FAILED", { 
        expectedId: razorpay_order_id,
        receivedId: razorpayOrder?.id
      });
      return res.status(400).json({
        success: false,
        message: "Unable to validate Razorpay order",
        details: {
          expectedId: razorpay_order_id,
          receivedId: razorpayOrder?.id
        }
      });
    }

    // ✅ USE UNIFIED RESERVESTOCK SERVICE - This handles:
    // - Stock validation for all items
    // - Stock reduction (both variants and simple products)
    // - Inventory logging
    // - Transaction safety via session
    logger.info("📦 STARTING TRANSACTION FOR STOCK RESERVATION", {
      itemCount: Array.isArray(orderData?.items) ? orderData.items.length : 0
    });

    let itemSnapshots, totals;
    await session.withTransaction(async () => {
      try {
        const reserveResult = await reserveStock({
          items: orderData?.items || [],
          session,
          orderNumber: `RZP-${Date.now()}`, // Temporary order number for Razorpay
          reason: "Razorpay payment verified",
          discountTotal: orderData?.totals?.discountTotal || 0,
          shippingFee: orderData?.totals?.shippingFee || 0,
          roundingAdjustment: orderData?.totals?.roundingAdjustment || 0
        });
        itemSnapshots = reserveResult.itemSnapshots;
        totals = reserveResult.totals;
        logger.info("✅ STOCK RESERVED SUCCESSFULLY", {
          itemCount: itemSnapshots.length,
          grandTotal: totals.grandTotal
        });
      } catch (inventoryErr) {
        if (inventoryErr instanceof InventoryError) {
          throw inventoryErr;
        }
        throw new InventoryError(inventoryErr.message, 500, "INVENTORY_SERVICE_ERROR");
      }
    });

    // Generate internal order ID
    const orderId = generateOrderId();
    logger.info("🆔 INTERNAL ORDER ID GENERATED", { orderId });

    // Create order in database (outside transaction since stock already reduced in transaction)
    const createdOrder = await Order.create({
      orderId,
      orderNumber: `RZP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customer: {
        userId: null,
        name: orderData?.customer?.name || "Guest",
        email: orderData?.customer?.email || "",
        phone: orderData?.customer?.phone || ""
      },
      shippingAddress: {
        line1: orderData?.customer?.address || "",
        city: orderData?.customer?.city || "",
        state: orderData?.customer?.state || "Maharashtra",
        postalCode: orderData?.customer?.pincode || "",
        country: "IN"
      },
      items: itemSnapshots,
      payment: {
        method: "RAZORPAY",
        status: "PAID",
        gateway: "razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date()
      },
      status: "PLACED",
      statusTimestamps: {
        placedAt: new Date()
      },
      totals: {
        ...totals,
        currency: razorpayOrder.currency || "INR"
      },
      metadata: {
        razorpayOrderStatus: razorpayOrder.status,
        ...orderData?.metadata
      }
    });

    logger.info("✅ ORDER CREATED IN DATABASE", { 
      orderId: createdOrder.orderId,
      mongoId: createdOrder._id,
      orderNumber: createdOrder.orderNumber,
      razorpayOrderId: razorpay_order_id
    });

    // Emit socket event
    const io = getIo();
    if (io) {
      io.emit("newOrder", createdOrder.toObject());
      logger.info("📡 SOCKET.IO EVENT EMITTED - newOrder", { orderId: createdOrder._id });
    }

    logger.info("✅ PAYMENT VERIFICATION COMPLETE - SUCCESS", {
      orderId: createdOrder.orderId,
      mongoId: createdOrder._id,
      razorpayOrderId: razorpay_order_id,
      totalAmount: createdOrder.totals?.grandTotal,
      itemCount: createdOrder.items?.length,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and order created successfully",
      order: createdOrder
    });
  } catch (error) {
    logger.error("❌ PAYMENT VERIFICATION FAILED - EXCEPTION", {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      errorCode: error.code,
      isInventoryError: error instanceof InventoryError,
      mongooseValidationErrors: error.errors,
      receivedPayload: {
        razorpayOrderId: req.body?.razorpay_order_id,
        razorpayPaymentId: req.body?.razorpay_payment_id,
        hasSignature: !!req.body?.razorpay_signature,
        hasOrderData: !!req.body?.orderData
      },
      timestamp: new Date().toISOString()
    });

    // Handle inventory errors with proper HTTP status
    if (error instanceof InventoryError) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    // Return detailed error for debugging
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
      errorCode: error.code,
      errorName: error.name,
      details: error.errors || error.message
    });
  } finally {
    if (session) {
      await session.endSession();
      logger.info("🔐 DATABASE SESSION CLOSED", { timestamp: new Date().toISOString() });
    }
  }
};