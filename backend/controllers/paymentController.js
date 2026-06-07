import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { getIo } from "../socket.js";
import { logger } from "../utils/logger.js";
import generateOrderId from "../utils/orderIdGenerator.js";
import { InventoryError, reserveStock } from "../services/inventoryService.js";

import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendOrderPlacedEmail,
  sendAdminNewOrderAlert
} from "../services/emailService.js";

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

    logger.info("🔐 PAYMENT_STEP_6_VERIFY_REQUEST_RECEIVED", {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      hasSignature: !!razorpay_signature,
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
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      logger.error("❌ RAZORPAY_KEY_SECRET IS MISSING FROM ENVIRONMENT");
      return res.status(500).json({
        success: false,
        message: "Payment configuration error on server"
      });
    }

    const verificationString = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(verificationString)
      .digest("hex");

    const signatureMatches = expectedSignature === razorpay_signature;
    
    if (!signatureMatches) {
      logger.error("❌ SIGNATURE VERIFICATION FAILED", {
        received: razorpay_signature,
        expected: expectedSignature,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        secretPrefix: keySecret.substring(0, 4)
      });

      // Notify customer about failed payment if email exists
      if (orderData?.customer?.email) {
        const mockOrder = {
          orderNumber: razorpay_order_id,
          customer: {
            name: orderData?.customer?.name || "Guest",
            email: orderData?.customer?.email
          },
          totals: {
            grandTotal: orderData?.totals?.grandTotal || "0"
          },
          payment: { method: "RAZORPAY" }
        };
        sendPaymentFailedEmail(mockOrder).catch(err => logger.error("Failed to send payment failed email", err));
      }

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Verification failed.",
        details: { reason: "Signature mismatch" }
      });
    }

    logger.info("🟢 PAYMENT_STEP_7_SIGNATURE_VALID", {
      razorpayOrderId: razorpay_order_id,
      timestamp: new Date().toISOString()
    });

    // Check if payment already processed (check both payment ID and order ID for maximum safety)
    const existingOrder = await Order.findOne({ 
      $or: [
        { "payment.razorpayPaymentId": razorpay_payment_id },
        { "payment.razorpayOrderId": razorpay_order_id }
      ]
    });

    if (existingOrder) {
      logger.warn("⚠️ PAYMENT ALREADY PROCESSED", {
        orderNumber: existingOrder.orderNumber,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
      });
      return res.status(409).json({
        success: false,
        message: "This payment has already been processed and recorded.",
        order: existingOrder
      });
    }

    // Fetch and validate Razorpay order
    const razorpay = getRazorpayClient();
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    } catch (razorpayFetchError) {
      logger.error("❌ FAILED TO FETCH RAZORPAY ORDER", {
        razorpayOrderId: razorpay_order_id,
        error: razorpayFetchError.message
      });
      return res.status(400).json({
        success: false,
        message: "Unable to validate Razorpay order"
      });
    }

    if (!razorpayOrder || razorpayOrder.id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order validation failed"
      });
    }

    let createdOrder;
    // Execute stock reservation AND order creation inside the same transaction
    await session.withTransaction(async () => {
      try {
        // ── COUPON VALIDATION ──
        let coupon = null;
        const couponCode = orderData?.couponCode || orderData?.totals?.couponCode;
        if (couponCode) {
          const foundCoupon = await Coupon.findOne({ code: String(couponCode).toUpperCase().trim() });
          if (foundCoupon) {
            const validation = foundCoupon.isValid(orderData?.totals?.itemsSubtotal || 0);
            if (validation.valid) {
              coupon = foundCoupon;
            }
          }
        }

        const { itemSnapshots, totals } = await reserveStock({
          items: orderData?.items || [],
          session,
          orderNumber: `RZP-${Date.now()}`,
          reason: "Razorpay payment verified",
          coupon, // Pass coupon for discount calculation
          discountTotal: orderData?.totals?.discountTotal || 0,
          shippingFee: orderData?.totals?.shippingFee || 0,
          pincode: orderData?.shippingAddress?.postalCode || orderData?.customer?.pincode || "",
          roundingAdjustment: orderData?.totals?.roundingAdjustment || 0
        });

        if (coupon) {
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } }, { session });
        }

        // Create order in database within the transaction
        const [orderDoc] = await Order.create([{
          orderId: generateOrderId(),
          orderNumber: `ORD-RZP-${Date.now().toString(36).toUpperCase()}`,
          customer: {
            userId: orderData?.customer?.userId || req.user?.userId || null,
            name: orderData?.customer?.name || "Guest",
            email: orderData?.customer?.email || "",
            phone: orderData?.customer?.phone || ""
          },
          shippingAddress: {
            line1: orderData?.shippingAddress?.line1 || orderData?.customer?.address || "",
            city: orderData?.shippingAddress?.city || orderData?.customer?.city || "",
            state: orderData?.shippingAddress?.state || orderData?.customer?.state || "Maharashtra",
            postalCode: orderData?.shippingAddress?.postalCode || orderData?.shippingAddress?.pincode || orderData?.customer?.pincode || orderData?.customer?.postalCode || "",
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
            gstTotal: totals.gstTotal || 0,
            currency: razorpayOrder.currency || "INR"
          },
          coupon: coupon ? {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
          } : undefined,
          metadata: {
            razorpayOrderStatus: razorpayOrder.status,
            ...orderData?.metadata
          }
        }], { session });

        createdOrder = orderDoc;
      } catch (err) {
        logger.error("❌ TRANSACTION FAILED", { error: err.message });
        throw err;
      }
    });

    if (!createdOrder) {
      throw new Error("Order creation failed during transaction");
    }

    logger.info("🟢 PAYMENT_STEP_8_ORDER_CREATED", {
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder._id,
      timestamp: new Date().toISOString()
    });

    // Emit socket event (Standardized)
    const io = getIo();
    if (io) {
      const payload = createdOrder.toObject();
      console.log("=========================================");
      console.log(`📡 EVENT_EMITTED: order:new`);
      console.log(`📡 ORDER_ID: ${payload.orderNumber}`);
      console.log(`📡 EVENT_PAYLOAD:`, JSON.stringify(payload, null, 2));
      console.log("=========================================");
      io.emit("order:new", payload);
    }

    // Send emails asynchronously
    sendPaymentSuccessEmail(createdOrder).catch(err => logger.error("Failed to send payment success email", err));
    sendOrderPlacedEmail(createdOrder).catch(err => logger.error("Failed to send order placed email", err));
    sendAdminNewOrderAlert(createdOrder).catch(err => logger.error("Failed to send admin alert email", err));

    return res.status(200).json({
      success: true,
      message: "Payment verified and order created successfully",
      order: createdOrder
    });
  } catch (error) {
    logger.error("❌ PAYMENT VERIFICATION FAILED", {
      errorMessage: error.message,
      errorCode: error.code
    });

    if (error instanceof InventoryError) {
      return res.status(error.status || 400).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment"
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};