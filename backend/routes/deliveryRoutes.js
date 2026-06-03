import { Router } from "express";
import { handleDeliveryWebhook } from "../services/delivery/index.js";
import { calculateDelivery, checkAvailability } from "../controllers/deliveryController.js";
import Order from "../models/Order.js";
import { getIo } from "../socket.js";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * Public routes for delivery fee calculation and availability checks
 */
router.post("/calculate", calculateDelivery);
router.post("/check-availability", checkAvailability);

/**
 * WEBHOOK: Unified Delivery Status Webhook (Borzo-only)
 */
router.post("/webhook/:provider", async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  if (provider !== "borzo") {
    return res.status(400).json({ success: false, message: "Invalid provider" });
  }

  try {
    // ── TEMPORARY WEBHOOK DIAGNOSTIC LOGS ──
    console.log("=========================================");
    console.log("🚨 BORZO_WEBHOOK_HIT");
    console.log("📋 BORZO_WEBHOOK_HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("📦 BORZO_WEBHOOK_BODY:", JSON.stringify(payload, null, 2));
    console.log("=========================================");

    const result = await handleDeliveryWebhook(payload);

    if (!result || result.event === "unknown") {
      return res.status(200).json({ success: true, message: "Webhook ignored" });
    }

    const order = await Order.findOne({
      $or: [
        { "delivery.providerOrderId": String(result.taskId) },
        { "delivery.trackingId": String(result.taskId) },
        { orderNumber: String(result.taskId) }
      ]
    });

    if (!order) {
      logger.warn(`⚠️ [WEBHOOK] Order not found for taskId: ${result.taskId}`);
      return res.status(200).json({ success: true });
    }

    let statusChanged = false;

    // Sync rider details
    if (result.rider?.name && (!order.rider?.name || result.rider.name !== order.rider.name)) {
      order.rider = {
        name: result.rider.name,
        phone: result.rider.phone || order.rider?.phone,
        vehicleNumber: result.rider.vehicleNumber || order.rider?.vehicleNumber
      };
      statusChanged = true;
    }

    // Map provider events to internal order status
    switch (result.event) {
      case "searching_courier":
        if (order.delivery.status !== "SEARCHING_FOR_RIDER") {
          order.delivery.status = "SEARCHING_FOR_RIDER";
          statusChanged = true;
        }
        break;

      case "courier_assigned":
        if (order.delivery.status !== "RIDER_ASSIGNED") {
          order.delivery.status = "RIDER_ASSIGNED";
          order.delivery.assignedAt = new Date();
          statusChanged = true;
        }
        break;

      case "picked_up":
        if (order.status !== "PICKED_UP") {
          order.status = "PICKED_UP";
          order.statusTimestamps.pickedUpAt = new Date();
          order.delivery.status = "PICKED_UP";
          statusChanged = true;
        }
        break;

      case "delivered":
        if (order.status !== "DELIVERED") {
          order.status = "DELIVERED";
          order.statusTimestamps.deliveredAt = new Date();
          order.delivery.status = "DELIVERED";
          statusChanged = true;
        }
        break;

      case "canceled":
      case "failed_delivery":
        if (order.delivery.status !== "DELIVERY_FAILED") {
          order.delivery.status = "DELIVERY_FAILED";
          statusChanged = true;
        }
        break;
    }

    if (statusChanged) {
      await order.save();
      const io = getIo();
      if (io) io.emit("order:updated", order.toObject());
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`❌ [WEBHOOK] Error handling Borzo webhook:`, error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
