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
 * Helper: Build a robust address string for delivery providers
 */
const buildFormattedAddress = (addr) => {
  if (!addr) return "";

  // ── LOGGING: Original Address Components ──
  console.log("📍 ADDRESS_SYNC_START:", {
    line1: addr.line1,
    line2: addr.line2,
    landmark: addr.landmark,
    city: addr.city,
    state: addr.state,
    pincode: addr.postalCode
  });

  const components = [];

  // Extract and trim fields
  const line1 = String(addr.line1 || "").trim();
  const line2 = String(addr.line2 || "").trim();
  const landmark = String(addr.landmark || "").trim();
  const city = String(addr.city || "").trim();
  const state = String(addr.state || "").trim();
  const pincode = String(addr.postalCode || "").trim();

  // 1. Add Line 1 (Required)
  if (line1) components.push(line1);

  // 2. Add Line 2 if not already in Line 1
  if (line2 && !line1.toLowerCase().includes(line2.toLowerCase())) {
    components.push(line2);
  }

  // 3. Add Landmark if not already included
  if (landmark) {
    const cleanLandmark = landmark.toLowerCase().startsWith("near") ? landmark : `Near ${landmark}`;
    const combinedCurrent = components.join(", ").toLowerCase();
    if (!combinedCurrent.includes(landmark.toLowerCase())) {
      components.push(cleanLandmark);
    }
  }

  // 4. Add City
  const currentAddressStr = components.join(", ").toLowerCase();
  if (city && !currentAddressStr.includes(city.toLowerCase())) {
    components.push(city);
  }

  // 5. Add State (Normalize Maharashtra)
  if (state) {
    const isMaharashtra = state.toLowerCase().includes("maharashtra") || state.toLowerCase() === "mh";
    if (isMaharashtra && !currentAddressStr.includes("maharashtra")) {
      components.push("Maharashtra");
    } else if (!isMaharashtra && !currentAddressStr.includes(state.toLowerCase())) {
      components.push(state);
    }
  }

  // 6. Add Pincode
  if (pincode && !currentAddressStr.includes(pincode)) {
    components.push(pincode);
  }

  // 7. Add Country
  if (!currentAddressStr.includes("india")) {
    components.push("India");
  }

  const finalAddress = components.join(", ");
  
  // ── LOGGING: Final Rebuilt Address ──
  console.log("📍 DELIVERY_SERVICE_ADDRESS:", finalAddress);

  return finalAddress;
};

/**
 * ASSIGN DELIVERY PARTNER
 * This function is called ONLY when an order is marked READY.
 * It uses the unified delivery provider system to create a real task.
 */
export const assignDeliveryPartner = async (orderId) => {
  console.log(`===== DELIVERY FLOW START (${process.env.DEFAULT_DELIVERY_PROVIDER || "borzo"}) =====`);
  console.log("CALLING assignDeliveryPartner()");
  logger.info(`🚚 [MARK READY] STEP 4 - ASSIGN DELIVERY CALLED for Order: ${orderId}`);
  
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("ORDER NOT FOUND");
      logger.error(`❌ [MARK READY] FAILED - Order ${orderId} not found`);
      throw new Error("Order not found");
    }

    console.log("ORDER ID:", order._id);
    console.log("STORED MONGODB ADDRESS:", JSON.stringify(order.shippingAddress, null, 2)); // Added for Issue 1
    console.log("ORDER STATUS:", order.status);
    console.log("DELIVERY DATA:", JSON.stringify(order.delivery, null, 2));
    console.log("providerOrderId:", order.delivery?.providerOrderId);
    console.log("DELIVERY STATUS:", order.delivery?.status);

    // ── LOGGING: ASSIGN_DELIVERY_ADDRESS ──
    console.log("📍 ASSIGN_DELIVERY_ADDRESS:", JSON.stringify(order.shippingAddress, null, 2));

    // ── STRICT IDEMPOTENCY PROTECTION (FIXED) ──
    // ONLY block duplicate creation if an ACTUAL provider task ID exists.
    // Check for non-empty string to avoid blocking on initialized empty values.
    if (order.delivery?.providerOrderId && order.delivery.providerOrderId.trim() !== "") {
      console.log("DUPLICATE DETECTED - BLOCKING");
      logger.warn(`⚠️ [MARK READY] SKIPPED - Delivery task already exists (${order.delivery.providerOrderId}) for Order ${order.orderNumber}`);
      return order;
    }

    console.log(`CALLING ${process.env.DEFAULT_DELIVERY_PROVIDER || "borzo"} NOW`);

    // ── PHASE 1: PINCODE VALIDATION ──
    const pincode = order.shippingAddress?.postalCode;
    if (!pincode || String(pincode).length !== 6) {
      throw new Error("Invalid or missing pincode for delivery assignment.");
    }

    const zone = getZoneByPincode(pincode);
    if (!zone || !zone.available) {
      const errorMsg = `Pincode ${pincode} is not in allowed delivery zones.`;
      logger.error(`🛑 [DELIVERY PROTECTION] Blocking task creation. Reason: ${errorMsg}`);
      order.delivery = { ...order.delivery, status: "FAILED", error: errorMsg };
      await order.save();
      throw new Error(errorMsg);
    }

    const provider = process.env.DEFAULT_DELIVERY_PROVIDER || "borzo";

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
        name: "Mithai World",
        geo: { lat: 18.5679, lng: 73.9143 } // Mithai World exact location
      },
      dropoff: {
        address: order.shippingAddress?.fullAddress || buildFormattedAddress(order.shippingAddress),
        phone: order.customer.phone,
        name: order.customer.name,
        pincode: order.shippingAddress.postalCode,
        geo: order.shippingAddress.geo || null,
        landmark: order.shippingAddress.landmark || "",
        note: order.notes || ""
      },
      items: order.items.map(item => ({
        name: item.titleSnapshot || item.name,
        quantity: item.quantity,
        price: item.priceSnapshot || item.price
      })),
      totalAmount: order.totals?.grandTotal
    };

    // ── STEP 5: DELIVERY API REQUEST ──
    console.log("📍 FINAL_BORZO_DROPOFF_ADDRESS:", payload.dropoff.address);
    logger.info(`📡 [MARK READY] STEP 5 - ${provider.toUpperCase()} API REQUEST for Order ${order.orderNumber}`);
    const task = await createDeliveryTask(payload, { provider });
    
    console.log(`${provider.toUpperCase()} RESPONSE RECEIVED`, JSON.stringify(task, null, 2));

    // ── STEP 6: RESPONSE RECEIVED ──
    if (!task || !task.taskId) {
      logger.error(`❌ [MARK READY] STEP 6 - FAILED. No taskId returned from ${provider}`);
      throw new Error(`${provider} failed to return a task ID`);
    }
    logger.info(`✅ [MARK READY] STEP 6 - ${provider.toUpperCase()} RESPONSE RECEIVED. Task ID: ${task.taskId}`);

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
    console.log("ORDER SAVED TO DB");
    logger.info(`💾 [MARK READY] STEP 7 - DELIVERY SAVED with OTP: ${pickupOtp}`);

    const io = getIo();
    if (io) io.emit("order:updated", order.toObject());

    return order;
  } catch (error) {
    console.log("ASSIGN DELIVERY FAILED:", error.message);
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
