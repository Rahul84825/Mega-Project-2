import { logger } from "../utils/logger.js";
import { getIo } from "../socket.js";
import Order from "../models/Order.js";
import { createDeliveryTask, getTrackingDetails } from "./delivery/index.js";
import { validateDeliveryRadius } from "./locationService.js";
import { getZoneByPincode } from "../config/pincodeZones.js";

/**
 * Helper: Parse weight string (e.g., "500g", "1kg", "0.5") to kg
 */
const parseWeightToKg = (weightStr, quantity = 1) => {
  if (!weightStr) return 0.1 * quantity; // Default 100g per item
  const str = String(weightStr).toLowerCase().trim();
  const numeric = parseFloat(str.replace(/[^0-9.]/g, ""));
  if (isNaN(numeric)) return 0.1 * quantity;

  if (str.includes("kg")) return numeric * quantity;
  if (str.includes("g")) return (numeric / 1000) * quantity;
  
  // If no unit is provided:
  // 1. If numeric is >= 10, it's almost certainly grams (e.g., "250", "500")
  // 2. If numeric is < 10, it's likely already in kg (e.g., "0.5", "1", "2.5")
  if (numeric < 10) return numeric * quantity;
  
  return (numeric / 1000) * quantity; // Assume grams for larger numbers without units
};

/**
 * ASSIGN DELIVERY PARTNER
 * This function is called ONLY when an order is marked READY.
 * It uses the unified delivery provider system to create a real task.
 */
export const assignDeliveryPartner = async (orderId) => {
  logger.info(`🚚 [MARK READY] STEP 4 - ASSIGN DELIVERY CALLED for Order: ${orderId}`);
  
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`❌ [MARK READY] FAILED - Order ${orderId} not found`);
      throw new Error("Order not found");
    }

    // ── STRICT IDEMPOTENCY PROTECTION (FIXED) ──
    // We ONLY block if a real providerTaskId already exists.
    if (order.delivery?.providerOrderId) {
      logger.warn(`⚠️ [MARK READY] SKIPPED - Delivery task already exists (${order.delivery.providerOrderId}) for Order ${order.orderNumber}`);
      return order;
    }

    // ── PHASE 1: PINCODE VALIDATION ──
    const pincode = order.shippingAddress?.postalCode;
    if (!pincode || String(pincode).length !== 6) {
      throw new Error("Invalid or missing pincode for delivery assignment.");
    }

    const zone = getZoneByPincode(pincode);
    if (!zone || !zone.available) {
      const errorMsg = `Pincode ${pincode} is not in allowed delivery zones.`;
      logger.error(`🛑 [BORZO PROTECTION] Blocking task creation. Reason: ${errorMsg}`);
      order.delivery = { ...order.delivery, status: "FAILED", error: errorMsg };
      await order.save();
      throw new Error(errorMsg);
    }

    const provider = "borzo";

    // ── PHASE 2: WEIGHT CALCULATION ──
    const totalWeightKg = order.items.reduce((sum, item) => {
      const itemWeight = parseWeightToKg(item.selectedVariant?.weight, item.quantity);
      return sum + itemWeight;
    }, 0);
    const finalWeight = Math.max(0.1, totalWeightKg);

    // ── PHASE 3: PAYLOAD PREPARATION ──
    const payload = {
      orderNumber: order.orderNumber,
      totalWeightKg: finalWeight,
      pickup: {
        address: "Mithai World, Viman Nagar, Pune, Maharashtra 411014, India",
        phone: "9881988751",
        name: "Mithai World"
      },
      dropoff: {
        address: `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state || "Maharashtra"} ${order.shippingAddress.postalCode || ""}, India`,
        phone: order.customer.phone,
        name: order.customer.name
      },
      items: order.items.map(item => ({
        name: item.titleSnapshot || item.name,
        quantity: item.quantity
      }))
    };

    // ── STEP 5: BORZO API REQUEST ──
    logger.info(`📡 [MARK READY] STEP 5 - BORZO API REQUEST for Order ${order.orderNumber}`);
    const task = await createDeliveryTask(payload, { provider });
    
    // ── STEP 6: BORZO RESPONSE RECEIVED ──
    if (!task || !task.taskId) {
      logger.error(`❌ [MARK READY] STEP 6 - FAILED. No taskId returned from Borzo`);
      throw new Error("Borzo failed to return a task ID");
    }
    logger.info(`✅ [MARK READY] STEP 6 - BORZO RESPONSE RECEIVED. Task ID: ${task.taskId}`);

    // ── STEP 7: DELIVERY SAVED ──
    // Generate simple 4-digit pickup OTP for verbal confirmation
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    logger.info(`✅ [MARK READY] STEP 3 - OTP GENERATED: ${pickupOtp}`);

    order.delivery = {
      ...(order.delivery || {}),
      provider: provider,
      providerOrderId: task.taskId,
      trackingId: task.taskId,
      trackingUrl: task.trackingUrl || "",
      status: task.rider?.name ? "RIDER_ASSIGNED" : "DELIVERY_ASSIGNED",
      assignedAt: new Date(),
      pickupOtp: pickupOtp
    };

    if (task.rider?.name) {
      order.rider = {
        name: task.rider.name,
        phone: task.rider.phone,
        vehicleNumber: task.rider.vehicleNumber || ""
      };
    }

    await order.save();
    logger.info(`💾 [MARK READY] STEP 7 - DELIVERY SAVED with OTP: ${pickupOtp}`);

    const io = getIo();
    if (io) io.emit("order:updated", order.toObject());

    return order;
  } catch (error) {
    logger.error("❌ [MARK READY] FAILED at assignDeliveryPartner:", {
      message: error.message,
      orderId
    });
    throw error;
  }
};

/**
 * Automates the transition from PREPARING to READY.
 */
export const scheduleOrderReady = (orderId, etaMinutes) => {
  const ms = etaMinutes * 60 * 1000;
  
  logger.info(`⏱️ Scheduling order ${orderId} to be READY in ${etaMinutes} minutes`);
  
  setTimeout(async () => {
    try {
      const order = await Order.findById(orderId);
      // Ensure it hasn't been manually moved or cancelled
      if (order && order.status === "PREPARING") {
        order.status = "READY";
        order.statusTimestamps.readyForPickupAt = new Date();
        order.preparation.readyBy = new Date();
        
        await order.save();
        
        const io = getIo();
        if (io) io.emit("order:updated", order); // Matches frontend listener name
        
        logger.info(`✅ Order ${order.orderNumber} is now READY. Waiting for rider.`);
      }
    } catch (err) {
      logger.error(`Error in automated READY transition for order ${orderId}:`, err);
    }
  }, ms);
};
