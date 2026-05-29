import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import Order, { ORDER_STATUSES } from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import { getIo } from "../socket.js";
import { logger } from "../utils/logger.js";
import { InventoryError, reserveStock, restoreStock } from "../services/inventoryService.js";
import generateOrderId from "../utils/orderIdGenerator.js";
import { assignDeliveryPartner, scheduleOrderReady } from "../services/deliveryService.js";
import {
  sendOrderPlacedEmail,
  sendAdminNewOrderAlert,
  sendOrderAcceptedEmail,
  sendOrderPreparingEmail,
  sendOrderOutForDeliveryEmail,
  sendOrderDeliveredEmail,
  sendOrderRejectedEmail
  } from "../services/emailService.js";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};


const isValidOrderPayload = (orderData) => {
  return Boolean(orderData && typeof orderData === "object" && !Array.isArray(orderData));
};

const buildOrderNumber = () => {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${Date.now().toString(36).toUpperCase()}-${suffix}`;
};

const sanitizeOrder = (order) => {
  if (!order) {
    return order;
  }

  return typeof order.toObject === "function" ? order.toObject() : { ...order };
};

const sanitizeOrders = (orders) => orders.map((order) => sanitizeOrder(order));

const emitOrderEvent = (event, payload) => {
  const io = getIo();
  if (io) {
    // Standardize to order:new for placement and order:updated for all state changes
    const mappedEvent = (event === "orderPlaced" || event === "order:new") ? "order:new" : "order:updated";
    io.emit(mappedEvent, payload);
  }
};

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const orderData = req.body;

    // Debug logging - verify request payload
    logger.info("📦 PLACE_ORDER_REQUEST", {
      hasAmount: !!orderData?.amount,
      amount: orderData?.amount,
      hasCustomer: !!orderData?.customer,
      customerName: orderData?.customer?.name,
      customerAddress: orderData?.shippingAddress, // Added for debugging Issue 1
      itemCount: Array.isArray(orderData?.items) ? orderData.items.length : 0,
      hasTotals: !!orderData?.totals,
      paymentMethod: orderData?.payment?.method || orderData?.paymentMethod,
      bodyKeys: Object.keys(orderData || {})
    });

    if (!isValidOrderPayload(orderData)) {
      logger.warn("❌ INVALID_ORDER_PAYLOAD");
      return res.status(400).json({
        success: false,
        message: "Invalid order payload"
      });
    }

    const orderNumber = buildOrderNumber();
    const orderId = generateOrderId();
    let createdOrder;

    // ── COUPON VALIDATION ──
    let coupon = null;
    if (orderData.couponCode) {
      const foundCoupon = await Coupon.findOne({ code: orderData.couponCode.toUpperCase().trim() });
      if (foundCoupon) {
        const validation = foundCoupon.isValid(orderData.totals?.itemsSubtotal || 0);
        if (validation.valid) {
          coupon = foundCoupon;
        }
      }
    }

    await session.withTransaction(async () => {
      const { itemSnapshots, totals } = await reserveStock({
        items: orderData.items,
        session,
        orderNumber,
        reason: "Order placement",
        coupon, // Pass coupon for discount calculation
        discountTotal: orderData?.totals?.discountTotal,
        shippingFee: orderData?.totals?.shippingFee,
        pincode: orderData?.shippingAddress?.postalCode || "",
        roundingAdjustment: orderData?.totals?.roundingAdjustment
      });

      if (coupon) {
        // Increment coupon usage
        await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } }, { session });
      }

      const [orderDoc] = await Order.create(
        [
          {
            orderId,
            orderNumber,
            customer: {
              ...orderData.customer,
              userId: req.user?.userId || orderData.customer?.userId || null
            },
            shippingAddress: orderData.shippingAddress,
            items: itemSnapshots,
            payment: {
              method: orderData?.payment?.method || orderData?.paymentMethod || "RAZORPAY",
              status: orderData?.payment?.status || "PENDING",
              gateway: orderData?.payment?.gateway || "",
              razorpayOrderId: orderData?.payment?.razorpayOrderId,
              razorpayPaymentId: orderData?.payment?.razorpayPaymentId,
              razorpaySignature: orderData?.payment?.razorpaySignature
            },
            status: "PLACED",
            statusTimestamps: { placedAt: new Date() },
            preparation: {
              etaMinutes: Number(orderData?.preparation?.etaMinutes ?? null)
            },
            delivery: orderData?.delivery || {},
            rider: orderData?.rider || {},
            totals: {
              ...totals,
              currency: orderData?.totals?.currency || "INR"
            },
            coupon: coupon ? {
              code: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue
            } : undefined,
            notes: orderData?.notes || "",
            metadata: orderData?.metadata || {}
          }
        ],
        { session }
      );

      createdOrder = orderDoc;
    });

    if (!createdOrder) {
      logger.error("❌ ORDER_CREATION_FAILED - Document not created");
      return res.status(500).json({
        success: false,
        message: "Order could not be created"
      });
    }

    logger.info("✅ ORDER_PLACED_SUCCESS", {
      orderId: createdOrder?.orderId,
      mongoId: String(createdOrder._id),
      orderNumber: createdOrder.orderNumber,
      customerName: createdOrder.customer?.name,
      itemCount: createdOrder.items?.length || 0,
      paymentMethod: createdOrder.payment?.method,
      total: createdOrder.totals?.grandTotal
    });

    emitOrderEvent("orderPlaced", sanitizeOrder(createdOrder));
    logger.info("Order placed", { orderId: String(createdOrder._id) });

    // Send emails asynchronously
    sendOrderPlacedEmail(createdOrder).catch(err => logger.error("Failed to send order placed email", err));
    sendAdminNewOrderAlert(createdOrder).catch(err => logger.error("Failed to send admin alert email", err));

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: sanitizeOrder(createdOrder)
    });
  } catch (error) {
    logger.error("❌ ORDER_PLACEMENT_ERROR", {
      errorMessage: error.message,
      errorCode: error.code,
      errorStatus: error.status,
      isInventoryError: error instanceof InventoryError
    });

    if (error instanceof InventoryError) {
      logger.warn("📦 Inventory validation failed:", {
        code: error.code,
        message: error.message
      });
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code
      });
    }

    logger.error("Order placement failed", { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to place order"
    });
  } finally {
    session.endSession();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Fetch the user to get their email (in case userId was missing in previous orders)
    const user = await mongoose.model("User").findById(userId);
    const email = user?.email;

    const query = {
      $or: [
        { "customer.userId": userId }
      ]
    };

    if (email) {
      query.$or.push({ "customer.email": email });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders: sanitizeOrders(orders) });
  } catch (error) {
    logger.error("Failed to fetch my orders", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders"
    });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const etaMinutes = Number(req.body?.etaMinutes ?? 15);

    let order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "PREPARING" || order.status === "ACCEPTED") {
      // If already preparing, update ETA
      order.preparation.etaMinutes = etaMinutes;
      order.preparation.readyBy = new Date(Date.now() + etaMinutes * 60 * 1000);
      await order.save();
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    if (order.status !== "PLACED") {
      return res.status(400).json({ success: false, message: `Cannot accept order in ${order.status} state` });
    }

    order.status = "PREPARING"; // Swiggy style: Accepted = Preparing
    order.statusTimestamps.preparingAt = new Date();
    order.preparation.startsAt = new Date();
    if (Number.isFinite(etaMinutes)) {
      order.preparation.etaMinutes = etaMinutes;
      order.preparation.readyBy = new Date(Date.now() + etaMinutes * 60 * 1000);
    }

    await order.save();

    // ── DO NOT CREATE BORZO TASK YET ──
    // In Swiggy/Zomato model, we wait until food is READY before dispatching the rider.
    logger.info(`✅ Order ${order._id} accepted and preparing. Delivery assignment deferred until READY.`);

    emitOrderEvent("orderAccepted", sanitizeOrder(order));
    sendOrderAcceptedEmail(order).catch(err => logger.error("Failed to send accepted email", err));

    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    logger.error("Order acceptance failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to accept order"
    });
  }
};

export const rejectOrder = async (req, res) => {
  const { id } = req.params;
  const rejectionReason = String(req.body?.reason || "").trim();

  logger.info(`🚨 REJECT_INIT [${id}]`, { reason: rejectionReason });

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "REJECTED") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    // ── REFUND ──
    const payMethod = order.payment?.method;
    const payStatus = order.payment?.status;
    const rzpPaymentId = order.payment?.razorpayPaymentId;

    if (payMethod === "RAZORPAY" && payStatus === "PAID" && rzpPaymentId) {
      const razorpay = getRazorpayClient();
      if (razorpay) {
        try {
          const total = Number(order.totals?.grandTotal || order.total || 0);
          if (total > 0) {
            const refund = await razorpay.payments.refund(rzpPaymentId, {
              amount: Math.round(total * 100),
              notes: { reason: rejectionReason, orderNumber: order.orderNumber }
            });
            order.payment.status = "REFUNDED";
            order.payment.refundId = refund.id;
            logger.info(`✅ Refund success: ${refund.id}`);
          }
        } catch (rzpErr) {
          logger.error(`❌ Refund failed: ${rzpErr.message}`);
        }
      }
    }

    // ── STOCK RESTORATION ──
    try {
      const restoreItems = (order.items || []).map(i => ({
        productId: i.productId,
        variantId: i.selectedVariant?.variantId || null,
        quantity: i.quantity || 0
      }));

      if (restoreItems.length > 0) {
        await restoreStock({
          items: restoreItems,
          orderNumber: order.orderNumber,
          reason: `Admin Reject: ${rejectionReason}`
        });
      }
    } catch (stErr) {
      logger.error(`❌ Stock restoration failed: ${stErr.message}`);
    }

    // ── UPDATE ORDER ──
    order.status = "REJECTED";
    order.statusTimestamps.rejectedAt = new Date();
    order.rejectionReason = rejectionReason;
    await order.save();

    const sanitized = sanitizeOrder(order);
    emitOrderEvent("order:updated", sanitized);
    sendOrderRejectedEmail(order).catch(err => logger.error("Email failed", err));

    return res.status(200).json({ success: true, order: sanitized });

  } catch (error) {
    logger.error(`❌ REJECT_CRASH [${id}]`, { msg: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject order"
    });
  }
};

export const markPreparing = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "PREPARING") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    if (order.status !== "PLACED") {
      return res.status(400).json({ success: false, message: `Cannot mark preparing from ${order.status}` });
    }

    order.status = "PREPARING";
    order.statusTimestamps.preparingAt = new Date();
    await order.save();

    emitOrderEvent("orderPreparing", sanitizeOrder(order));
    sendOrderPreparingEmail(order).catch(err => logger.error("Failed to send preparing email", err));
    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order preparing"
    });
  }
};

export const markReadyForPickup = async (req, res) => {
  const { id } = req.params;
  console.log("STEP 1 - MARK READY CLICKED");
  logger.info(`🛎️ [MARK READY] STEP 1 - MARK READY CLICKED for Order: ${id}`);

  try {
    let order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ── STEP 2: ORDER STATUS UPDATED ──
    order.status = "READY";
    order.preparation.readyBy = new Date();
    order.statusTimestamps.readyForPickupAt = new Date();
    console.log("STEP 2 - STATUS UPDATED");
    
    await order.save();
    console.log("STEP 3 - ORDER SAVED");
    logger.info(`✅ [MARK READY] STEP 2 - ORDER STATUS UPDATED to READY for Order: ${order.orderNumber}`);

    // ── STEP 3: OTP GENERATED (Inside assignDeliveryPartner) ──
    // ── STEP 4-7: ASSIGN DELIVERY CALLED ──
    try {
      console.log("STEP 4 - CALLING ASSIGN DELIVERY");
      logger.info(`🚚 [MARK READY] STEP 4 - TRIGGERING assignDeliveryPartner for Order: ${order.orderNumber}`);
      order = await assignDeliveryPartner(order._id);
      console.log("STEP 5 - DELIVERY RESPONSE RECEIVED");
    } catch (assignError) {
      console.log("BORZO TASK CREATION FAILED");
      console.log(assignError.response?.data || assignError.message);
      logger.error(`❌ [MARK READY] FAILED - Delivery assignment failed:`, assignError.message);
      throw assignError; // DO NOT SWALLOW ERRORS
    }

    emitOrderEvent("order:updated", sanitizeOrder(order));
    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    logger.error(`❌ [MARK READY] CRITICAL ERROR:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order ready"
    });
  }
};

export const markPickedUp = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // SIMPLIFIED: No OTP validation in API. Handover is verbal.
    // This serves as a manual override if webhook fails.
    order.status = "PICKED_UP";
    order.statusTimestamps.pickedUpAt = new Date();
    if (order.delivery) {
      order.delivery.status = "PICKED_UP";
    }
    await order.save();

    emitOrderEvent("order:updated", sanitizeOrder(order));
    sendOrderOutForDeliveryEmail(order).catch(err => logger.error("Failed to send out for delivery email", err));
    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order picked up"
    });
  }
};

export const markDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "DELIVERED") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    order.status = "DELIVERED";
    order.statusTimestamps.deliveredAt = new Date();

    await order.save();

    emitOrderEvent("orderDelivered", sanitizeOrder(order));
    sendOrderDeliveredEmail(order).catch(err => logger.error("Failed to send delivered email", err));
    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order delivered"
    });
  }
};

export const getOrdersByStatus = async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    if (status && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const query = status ? { status } : {};
    
    // PRODUCTION FIX: Added .limit(50) and .lean() to prevent memory exhaustion
    // as order volume grows. Admin dashboard only needs the latest 50 for the current view.
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

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

export const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order"
    });
  }
};
