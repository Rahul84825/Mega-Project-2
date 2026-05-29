import { Router } from "express";
import { handleDeliveryWebhook } from "../services/delivery/index.js";
import { calculateDelivery, checkAvailability } from "../controllers/deliveryController.js";
import Order from "../models/Order.js";
import { logger } from "../utils/logger.js";
import { getIo } from "../socket.js";

const router = Router();

/**
 * CHECK AVAILABILITY: /api/delivery/check-availability
 * Check radius and internal delivery fee
 */
router.post("/check-availability", checkAvailability);

/**
 * CALCULATE: /api/delivery/calculate
 * Calculate dynamic delivery fee from provider
 */
router.post("/calculate", calculateDelivery);

/**
 * WEBHOOK: /api/delivery/webhook/:provider
 * Receives status updates from delivery partners (Borzo, Dunzo, etc.)
 */
router.post("/webhook/:provider", async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  // ── LOGGING: Webhook Received ──
  logger.info(`📦 BORZO_WEBHOOK_RECEIVED`, { provider, payload });

  // ── SECURITY: Webhook Validation ──
  if (provider === "borzo") {
    const receivedToken = req.headers["x-dv-auth-token"];
    const expectedToken = process.env.BORZO_CALLBACK_TOKEN;
    
    if (expectedToken && receivedToken !== expectedToken) {
      logger.warn(`🛑 Unauthorized Borzo webhook attempt. Invalid token.`);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }

  try {
    // 1. Parse provider-specific webhook into a standard format
    const update = await handleDeliveryWebhook(payload, { provider });

    if (!update || !update.taskId) {
      logger.warn(`⚠️ [WEBHOOK] Ignored malformed webhook payload from ${provider}`);
      return res.status(200).json({ success: true, message: "Ignored" });
    }

    // ── LOGGING: Raw & Mapped Status ──
    logger.info(`🔍 BORZO_STATUS: RAW=${update.status} | MAPPED=${update.event}`);

    // 2. Find the order associated with this delivery task
    const order = await Order.findOne({ "delivery.providerOrderId": update.taskId });

    if (!order) {
      logger.warn(`⚠️ [WEBHOOK] No order found for ${provider} taskId: ${update.taskId}`);
      return res.status(200).json({ success: true, message: "Order not found" });
    }

    logger.info(`✅ ORDER_FOUND: ${order.orderNumber}`);

    // 3. Track history
    order.delivery.webhookHistory = order.delivery.webhookHistory || [];
    order.delivery.webhookHistory.push({
      event: update.event,
      receivedAt: new Date(),
      payload: payload
    });

    let statusChanged = false;

    // Map delivery events to internal order statuses with STRICT checks
    switch (update.event) {
      case "searching_courier":
        if (["RIDER_ASSIGNED", "PICKED_UP", "DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) break;
        if (order.delivery.status !== "SEARCHING_FOR_RIDER") {
          order.delivery.status = "SEARCHING_FOR_RIDER";
          statusChanged = true;
        }
        break;

      case "courier_assigned":
        if (["PICKED_UP", "DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) break;
        
        // If rider info changed, we should notify the frontend even if delivery status is already RIDER_ASSIGNED
        const oldRider = order.rider || {};
        const newRider = update.rider || {};
        if (newRider.name !== oldRider.name || newRider.phone !== oldRider.phone) {
          order.rider = {
            name: newRider.name || oldRider.name,
            phone: newRider.phone || oldRider.phone,
            vehicleNumber: newRider.vehicleNumber || oldRider.vehicleNumber
          };
          statusChanged = true;
        }

        if (order.delivery.status !== "RIDER_ASSIGNED") {
          order.delivery.status = "RIDER_ASSIGNED";
          order.delivery.assignedAt = order.delivery.assignedAt || new Date();
          statusChanged = true;
        }
        break;

      case "picked_up":
        if (["DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) break;
        if (order.status !== "PICKED_UP" || order.delivery.status !== "PICKED_UP") {
          order.status = "PICKED_UP";
          order.statusTimestamps.pickedUpAt = order.statusTimestamps.pickedUpAt || new Date();
          order.delivery.status = "PICKED_UP";
          statusChanged = true;
        }
        break;

      case "delivered":
        if (order.delivery.status === "DELIVERY_FAILED") break;
        if (order.status !== "DELIVERED" || order.delivery.status !== "DELIVERED") {
          order.status = "DELIVERED";
          order.statusTimestamps.deliveredAt = order.statusTimestamps.deliveredAt || new Date();
          order.delivery.status = "DELIVERED";
          statusChanged = true;
        }
        break;

      case "canceled":
      case "failed_delivery":
        if (order.delivery.status !== "DELIVERY_FAILED" && order.delivery.status !== "DELIVERED") {
          order.delivery.status = "DELIVERY_FAILED";
          statusChanged = true;
        }
        break;
    }

    if (statusChanged) {
      logger.info(`📝 ORDER_UPDATED: ${order.orderNumber} status changed to ${order.status}/${order.delivery.status}`);
    }

    // Always save to persist the webhookHistory
    await order.save();
    logger.info(`💾 MONGODB_SAVE_SUCCESS for Order: ${order.orderNumber}`);

    if (statusChanged) {
      // ── LOGGING: Socket Emission ──
      const io = getIo();
      if (io) {
        io.emit("order:updated", order.toObject());
        logger.info(`📡 SOCKET_EVENT_EMITTED: order:updated for Order: ${order.orderNumber}`);
      }
    } else {
      logger.info(`ℹ️ [WEBHOOK] No status change detected for Order: ${order.orderNumber}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error handling ${provider} webhook:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
