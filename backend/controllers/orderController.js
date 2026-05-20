import crypto from "crypto";
import mongoose from "mongoose";
import Order, { ORDER_STATUSES } from "../models/Order.js";
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

    await session.withTransaction(async () => {
      const { itemSnapshots, totals } = await reserveStock({
        items: orderData.items,
        session,
        orderNumber,
        reason: "Order placement",
        discountTotal: orderData?.totals?.discountTotal,
        shippingFee: orderData?.totals?.shippingFee,
        roundingAdjustment: orderData?.totals?.roundingAdjustment
      });

      const [orderDoc] = await Order.create(
        [
          {
            orderId,
            orderNumber,
            customer: orderData.customer,
            shippingAddress: orderData.shippingAddress,
            items: itemSnapshots,
            payment: {
              method: orderData?.payment?.method || orderData?.paymentMethod || "COD",
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
    const orders = await Order.find({ "customer.userId": userId }).sort({ createdAt: -1 });
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

    if (order.status === "PREPARING") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    order.status = "PREPARING";
    order.statusTimestamps.preparingAt = new Date();
    order.preparation.startsAt = new Date();
    if (Number.isFinite(etaMinutes)) {
      order.preparation.etaMinutes = etaMinutes;
      order.preparation.readyBy = new Date(Date.now() + etaMinutes * 60 * 1000);
    }

    await order.save();

    // Assign delivery partner
    order = await assignDeliveryPartner(order._id);

    // Schedule automated transition to READY
    if (Number.isFinite(etaMinutes)) {
      scheduleOrderReady(order._id, etaMinutes);
    }

    emitOrderEvent("orderAccepted", sanitizeOrder(order));
    logger.info("Order accepted", { orderId: String(order._id) });

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

export const verifyPickupOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "READY") {
      return res.status(400).json({ success: false, message: "Order is not ready for pickup" });
    }

    if (!order.delivery?.pickupOtp || order.delivery.pickupOtp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid pickup OTP" });
    }

    order.status = "PICKED_UP";
    order.statusTimestamps.pickedUpAt = new Date();
    
    // Update delivery status
    order.delivery.status = "PICKED_UP";
    
    await order.save();

    emitOrderEvent("orderPickedUp", sanitizeOrder(order));
    sendOrderOutForDeliveryEmail(order).catch(err => logger.error("Failed to send out for delivery email", err));
    
    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    logger.error("Failed to verify pickup OTP:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

export const rejectOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const rejectionReason = String(req.body?.reason || "").trim();

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "REJECTED") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    await session.withTransaction(async () => {
      order.status = "REJECTED";
      order.statusTimestamps.rejectedAt = new Date();
      order.rejectionReason = rejectionReason;
      await order.save({ session });

      // Restore stock for all items in the order
      await restoreStock({
        items: order.items.map(item => ({
          productId: item.productId,
          variantId: item.selectedVariant?.variantId,
          quantity: item.quantity
        })),
        session,
        orderNumber: order.orderNumber,
        reason: `Order Rejected: ${rejectionReason || "No reason provided"}`
      });
    });

    emitOrderEvent("orderRejected", sanitizeOrder(order));
    logger.warn("Order rejected", { orderId: String(order._id), rejectionReason });

    sendOrderRejectedEmail(order).catch(err => logger.error("Failed to send rejected email", err));

    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    logger.error("Order rejection failed", { error: error.message });
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject order"
    });
  } finally {
    session.endSession();
  }
};

export const markPreparing = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "PREPARING") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
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
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = "READY";
    order.preparation.readyBy = new Date();
    await order.save();

    emitOrderEvent("orderReady", sanitizeOrder(order));
    return res.status(200).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order ready"
    });
  }
};

export const markPickedUp = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "PICKED_UP") {
      return res.status(200).json({ success: true, order: sanitizeOrder(order) });
    }

    order.status = "PICKED_UP";
    order.statusTimestamps.pickedUpAt = new Date();
    await order.save();

    emitOrderEvent("orderPickedUp", sanitizeOrder(order));
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
    if (order.payment?.method === "COD" && order.payment?.status !== "PAID") {
      order.payment.status = "PAID";
      order.payment.paidAt = new Date();
    }

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
    const orders = await Order.find(query).sort({ createdAt: -1 });

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
