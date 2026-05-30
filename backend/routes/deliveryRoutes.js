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
  // 1. Log at the FIRST line of the webhook route
  console.log("BORZO_WEBHOOK_RECEIVED", req.body);

  // 7. Log every request header
  console.log("BORZO_WEBHOOK_HEADERS", req.headers);

  const { provider } = req.params;
  const payload = req.body;

  if (provider === "borzo") {
    // ── TEMPORARY WEBHOOK DIAGNOSTIC LOGS ──
    console.log("=========================================");
    console.log("🚨 BORZO_WEBHOOK_HIT");
    console.log("📋 BORZO_WEBHOOK_HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("📦 BORZO_WEBHOOK_BODY:", JSON.stringify(payload, null, 2));
    console.log("=========================================");
  }

  // ── LOGGING: RAW_BORZO_WEBHOOK ──
  console.log("-----------------------------------------");
  console.log(`📦 RAW_BORZO_WEBHOOK RECEIVED AT: ${new Date().toISOString()}`);
  console.log(`REQUEST_HEADERS:`, JSON.stringify(req.headers, null, 2));
  console.log(`REQUEST_BODY:`, JSON.stringify(payload, null, 2));
  console.log("-----------------------------------------");

  logger.info(`📦 BORZO_WEBHOOK_RECEIVED`, { provider, payload });

  // ── SECURITY: Webhook Validation ──
  if (provider === "borzo") {
    // 3. Add logging before auth validation
    console.log("BEFORE_AUTH_VALIDATION", {
      receivedToken: req.headers["x-dv-auth-token"] || "MISSING",
      expectedToken: process.env.BORZO_CALLBACK_TOKEN ? "PRESENT" : "MISSING"
    });

    const receivedToken = req.headers["x-dv-auth-token"];
    const expectedToken = process.env.BORZO_CALLBACK_TOKEN;
    
    // 8. Log callback token comparison result
    const comparisonResult = receivedToken === expectedToken;
    console.log("CALLBACK_TOKEN_COMPARISON_RESULT", {
      receivedToken,
      expectedToken,
      match: comparisonResult
    });

    if (expectedToken && !comparisonResult) {
      // 4. Add logging after auth validation (failed case)
      console.log("AFTER_AUTH_VALIDATION", { success: false, reason: "Token mismatch" });
      logger.warn(`🛑 Unauthorized Borzo webhook attempt. Invalid token.`);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 4. Add logging after auth validation (success case)
    console.log("AFTER_AUTH_VALIDATION", { success: true, reason: "Authorized" });
  }

  try {
    // 1. Parse provider-specific webhook into a standard format
    const update = await handleDeliveryWebhook(payload, { provider });

    // ── LOGGING: PARSED_WEBHOOK ──
    console.log("PARSED_WEBHOOK", JSON.stringify(update, null, 2));
    console.log(`PARSED_TASK_ID: ${update?.taskId}`);
    console.log(`PARSED_STATUS: ${update?.status}`);
    console.log(`PARSED_EVENT: ${update?.event}`);
    console.log(`PARSED_RIDER:`, JSON.stringify(update?.rider, null, 2));

    if (!update || !update.taskId || update.taskId.trim() === "") {
      console.log(`⚠️ INVALID_PROVIDER_ORDER_ID: Received "${update?.taskId}"`);
      console.log(`⚠️ LOOKUP_SKIPPED`);
      logger.warn(`⚠️ [WEBHOOK] Ignored malformed webhook payload from ${provider}`);
      return res.status(200).json({ success: true, message: "Ignored" });
    }

    console.log(`🔍 PROVIDER_ORDER_ID_LOOKUP: ${update.taskId}`);

    // 2. Find the order associated with this delivery task
    const order = await Order.findOne({ "delivery.providerOrderId": update.taskId });

    if (!order) {
      console.log(`⚠️ LOOKUP_SKIPPED: No order matches taskId ${update.taskId}`);
      logger.warn(`⚠️ [WEBHOOK] No order found for ${provider} taskId: ${update.taskId}`);
      return res.status(200).json({ success: true, message: "Order not found" });
    }

    console.log(`✅ ORDER_FOUND: ${order.orderNumber}`);

    // 3. Track history
    order.delivery.webhookHistory = order.delivery.webhookHistory || [];
    order.delivery.webhookHistory.push({
      event: update.event,
      receivedAt: new Date(),
      payload: payload
    });

    let statusChanged = false;

    // ── LOGISTICS METADATA SYNC: Ensure rider info is always updated if present ──
    const oldRider = order.rider || {};
    const newRider = update.rider || {};
    if (newRider.name && (newRider.name !== oldRider.name || newRider.phone !== oldRider.phone)) {
      console.log(`👤 RIDER_FOUND_IN_WEBHOOK: ${newRider.name}`);
      order.rider = {
        name: newRider.name,
        phone: newRider.phone || oldRider.phone,
        vehicleNumber: newRider.vehicleNumber || oldRider.vehicleNumber
      };
      statusChanged = true;
      logger.info(`👤 [WEBHOOK] RIDER_SYNCED: ${order.rider.name} for Order: ${order.orderNumber}`);
    }

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

    // 5. Add logging before MongoDB update
    console.log("BEFORE_MONGODB_UPDATE", {
      orderNumber: order.orderNumber,
      statusBefore: order.status,
      deliveryStatusBefore: order.delivery.status
    });

    // Always save to persist the webhookHistory
    await order.save();

    // 6. Add logging after MongoDB update
    console.log("AFTER_MONGODB_UPDATE", {
      orderNumber: order.orderNumber,
      statusAfter: order.status,
      deliveryStatusAfter: order.delivery.status
    });

    console.log(`💾 MONGODB_ORDER_STATUS: ${order.status}`);
    if (statusChanged && newRider.name) {
      console.log(`💾 RIDER_SAVED_TO_MONGODB: ${order.rider.name}`);
    }
    logger.info(`💾 MONGODB_SAVE_SUCCESS for Order: ${order.orderNumber}`);

    if (statusChanged) {
      // ── LOGGING: Socket Emission ──
      const io = getIo();
      if (io) {
        const payload = order.toObject();
        console.log("=========================================");
        console.log(`📡 EVENT_EMITTED: order:updated`);
        console.log(`📡 ORDER_ID: ${payload.orderNumber}`);
        console.log(`📡 EVENT_PAYLOAD:`, JSON.stringify(payload, null, 2));
        console.log("=========================================");
        io.emit("order:updated", payload);
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
