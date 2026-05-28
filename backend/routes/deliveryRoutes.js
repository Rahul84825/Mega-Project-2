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

  // ── SECURITY: Webhook Validation ──
  if (provider === "borzo") {
    const receivedToken = req.headers["x-dv-auth-token"];
    const expectedToken = process.env.BORZO_CALLBACK_TOKEN;
    
    if (expectedToken && receivedToken !== expectedToken) {
      logger.warn(`🛑 Unauthorized Borzo webhook attempt. Invalid token.`);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  }

  logger.info(`📦 Received ${provider} webhook`, { payload });

  try {
    // 1. Parse provider-specific webhook into a standard format
    const update = await handleDeliveryWebhook(payload, { provider });

    if (!update || !update.taskId) {
      return res.status(200).json({ success: true, message: "Ignored" });
    }

    // 2. Find the order associated with this delivery task
    const order = await Order.findOne({ "delivery.providerOrderId": update.taskId });

    if (!order) {
      logger.warn(`⚠️ No order found for ${provider} taskId: ${update.taskId}`);
      return res.status(200).json({ success: true, message: "Order not found" });
    }

    // 3. Prevent duplicate or backwards transitions & track history
    order.delivery.webhookHistory = order.delivery.webhookHistory || [];
    order.delivery.webhookHistory.push({
      event: update.event,
      receivedAt: new Date(),
      payload: payload
    });

    let statusChanged = false;

    logger.info(`🔄 Processing webhook event: ${update.event} for order ${order.orderNumber}`);

    // Map delivery events to internal order statuses with STRICT checks
    switch (update.event) {
      case "searching_courier":
        if (["RIDER_ASSIGNED", "PICKED_UP", "DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) {
          logger.warn(`⚠️ Ignoring searching_courier for ${order.orderNumber} as it is already ${order.delivery.status}`);
          break;
        }
        if (order.delivery.status !== "SEARCHING_FOR_RIDER") {
          order.delivery.status = "SEARCHING_FOR_RIDER";
          statusChanged = true;
          logger.info(`🔍 Order ${order.orderNumber} is now SEARCHING for courier via webhook`);
        }
        break;

      case "courier_assigned":
        if (["PICKED_UP", "DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) {
          logger.warn(`⚠️ Ignoring courier_assigned for ${order.orderNumber} as it is already ${order.delivery.status}`);
          break;
        }
        if (update.rider) {
          order.rider = {
            name: update.rider.name || order.rider.name,
            phone: update.rider.phone || order.rider.phone,
            vehicleNumber: update.rider.vehicleNumber || order.rider.vehicleNumber
          };
        }
        if (order.delivery.status !== "RIDER_ASSIGNED") {
          order.delivery.status = "RIDER_ASSIGNED";
          order.delivery.assignedAt = order.delivery.assignedAt || new Date();
          statusChanged = true;
          logger.info(`👤 Courier assigned to Order ${order.orderNumber} via webhook: ${update.rider?.name}`);
        }
        break;

      case "picked_up":
        if (["DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) {
          logger.warn(`⚠️ Ignoring picked_up for ${order.orderNumber} as it is already ${order.delivery.status}`);
          break;
        }
        if (order.status !== "PICKED_UP") {
          order.status = "PICKED_UP";
          order.statusTimestamps.pickedUpAt = order.statusTimestamps.pickedUpAt || new Date();
          order.delivery.status = "PICKED_UP";
          statusChanged = true;
          logger.info(`🚚 Order ${order.orderNumber} is now PICKED_UP via webhook`);
        }
        break;

      case "delivered":
        if (order.delivery.status === "DELIVERY_FAILED") {
          logger.warn(`⚠️ Ignoring delivered for ${order.orderNumber} as it is already FAILED`);
          break;
        }
        if (order.status !== "DELIVERED") {
          order.status = "DELIVERED";
          order.statusTimestamps.deliveredAt = order.statusTimestamps.deliveredAt || new Date();
          order.delivery.status = "DELIVERED";
          statusChanged = true;
          logger.info(`🏁 Order ${order.orderNumber} is now DELIVERED via webhook`);
        }
        break;

      case "canceled":
        if (order.delivery.status !== "DELIVERY_FAILED" && order.delivery.status !== "DELIVERED") {
          order.delivery.status = "DELIVERY_FAILED";
          // Swiggy style: Delivery failed, but order might need re-assignment or manual cancellation
          statusChanged = true;
          logger.warn(`⚠️ Delivery for order ${order.orderNumber} was CANCELLED via webhook`);
        }
        break;

      case "failed_delivery":
        if (order.delivery.status !== "DELIVERY_FAILED" && order.delivery.status !== "DELIVERED") {
          order.delivery.status = "DELIVERY_FAILED";
          statusChanged = true;
          logger.error(`❌ Delivery for order ${order.orderNumber} FAILED via webhook`);
        }
        break;
    }

    // Always save to persist the webhookHistory, even if status didn't change
    await order.save();

    if (statusChanged) {
      // Notify admin panel via Socket.io
      const io = getIo();
      if (io) {
        io.emit("order:updated", order.toObject());
      }
      
      logger.info(`✅ Order ${order.orderNumber} state updated successfully via ${provider} webhook`);
    } else {
      logger.info(`ℹ️ Webhook event ${update.event} for order ${order.orderNumber} resulted in no state change (idempotent)`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`❌ Error handling ${provider} webhook:`, error);
    // Always return 200 to provider to avoid retries if we don't want them, 
    // or return 500 if we want them to retry. 
    // For production, we usually return 200 unless it's a transient server error.
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
