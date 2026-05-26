import { Router } from "express";
import { handleDeliveryWebhook } from "../services/delivery/index.js";
import Order from "../models/Order.js";
import { logger } from "../utils/logger.js";
import { getIo } from "../socket.js";

const router = Router();

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

    // 3. Update order status based on webhook event
    let statusChanged = false;

    // Map delivery events to internal order statuses
    switch (update.event) {
      case "courier_assigned":
        if (update.rider) {
          order.rider = {
            name: update.rider.name || order.rider.name,
            phone: update.rider.phone || order.rider.phone,
            vehicleNumber: update.rider.vehicleNumber || order.rider.vehicleNumber
          };
        }
        order.delivery.status = "ASSIGNED";
        statusChanged = true;
        break;

      case "picked_up":
        order.status = "PICKED_UP";
        order.statusTimestamps.pickedUpAt = new Date();
        order.delivery.status = "PICKED_UP";
        statusChanged = true;
        break;

      case "delivered":
        order.status = "DELIVERED";
        order.statusTimestamps.deliveredAt = new Date();
        order.delivery.status = "DELIVERED";
        statusChanged = true;
        break;

      case "canceled":
        order.delivery.status = "CANCELLED";
        // Note: We might not want to cancel the whole order automatically
        statusChanged = true;
        break;

      case "failed_delivery":
        order.delivery.status = "FAILED";
        statusChanged = true;
        break;
    }

    if (statusChanged) {
      await order.save();
      
      // Notify admin panel via Socket.io
      const io = getIo();
      if (io) {
        io.emit("order:updated", order.toObject());
      }
      
      logger.info(`✅ Order ${order.orderNumber} updated via ${provider} webhook: ${update.event}`);
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
