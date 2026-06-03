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
 * Normalizes shipping address and geocodes it offline using GIS logic.
 * Enforces STEP 6 requirements.
 */
const normalizeAndGeocodeAddress = (addr) => {
  if (!addr) {
    return {
      normalizedAddress: "",
      lat: null,
      lng: null,
      landmark: ""
    };
  }

  // Preserve user address
  const line1 = String(addr.line1 || "").trim();
  const line2 = String(addr.line2 || "").trim();
  const landmark = String(addr.landmark || "").trim();
  const city = String(addr.city || "Pune").trim();
  const state = String(addr.state || "Maharashtra").trim();
  const pincode = String(addr.postalCode || "").trim();

  // Validate pincode
  const isPincodeValid = /^\d{6}$/.test(pincode);
  if (!isPincodeValid) {
    logger.warn(`⚠️ Invalid pincode detected: "${pincode}"`);
  }

  const addressParts = [];
  if (line1) addressParts.push(line1);
  if (line2) addressParts.push(line2);
  if (landmark) addressParts.push(`Near ${landmark}`);
  addressParts.push(city);
  addressParts.push(state);
  if (pincode) addressParts.push(pincode);
  addressParts.push("India");

  const normalizedAddress = addressParts.join(", ");

  // Geocode address
  let lat = 18.5204;
  let lng = 73.8567;

  if (pincode === "411014" || normalizedAddress.toLowerCase().includes("viman nagar")) {
    lat = 18.5626;
    lng = 73.9087;
  } else if (pincode === "411006" || normalizedAddress.toLowerCase().includes("yerwada")) {
    lat = 18.5529;
    lng = 73.8796;
  } else if (pincode === "411001" || normalizedAddress.toLowerCase().includes("pune camp")) {
    lat = 18.5135;
    lng = 73.8789;
  } else if (pincode === "411047" || normalizedAddress.toLowerCase().includes("lohegaon")) {
    lat = 18.5910;
    lng = 73.9189;
  } else if (pincode === "411032" || normalizedAddress.toLowerCase().includes("tingre nagar")) {
    lat = 18.5746;
    lng = 73.9038;
  }

  // ── LOGGING REQUIRED IN STEP 6 ──
  console.log("📍 NORMALIZED_ADDRESS:", normalizedAddress);
  console.log("📍 LATITUDE:", lat);
  console.log("📍 LONGITUDE:", lng);

  return {
    normalizedAddress,
    lat,
    lng,
    landmark
  };
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

    // ── STRICT IDEMPOTENCY PROTECTION (CONCURRENCY LOCK) ──
    // ONLY block duplicate creation if an ACTUAL provider task ID exists, or if a task creation is in progress.
    if (order.delivery?.status === "ASSIGNING" || (order.delivery?.providerOrderId && order.delivery.providerOrderId.trim() !== "")) {
      console.log("DUPLICATE DETECTED OR ASSIGNMENT IN PROGRESS - BLOCKING");
      logger.warn(`⚠️ [MARK READY] SKIPPED - Delivery task already in progress or exists for Order ${order.orderNumber}`);
      return order;
    }

    // Set intermediate state atomically to prevent concurrent double-triggers
    order.delivery = order.delivery || {};
    order.delivery.status = "ASSIGNING";
    await order.save();

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
    console.log("🚚 [DEBUG] RESOLVED_PROVIDER:", provider);

    // ── PHASE 2: WEIGHT CALCULATION ──
    const totalWeightKg = order.items.reduce((sum, item) => {
      const itemWeight = parseWeightToKg(item.selectedVariant?.weight, item.quantity);
      return sum + itemWeight;
    }, 0);
    const finalWeight = Math.max(0.1, totalWeightKg);

    // ── PHASE 3: ADDRESS NORMALIZATION & GEOCODING (STEP 6) ──
    const normalizedRes = normalizeAndGeocodeAddress(order.shippingAddress);

    // ── PHASE 4: PAYLOAD PREPARATION ──
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
        address: normalizedRes.normalizedAddress,
        phone: order.customer.phone,
        name: order.customer.name,
        pincode: order.shippingAddress.postalCode,
        geo: { lat: normalizedRes.lat, lng: normalizedRes.lng },
        landmark: normalizedRes.landmark || "",
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
    console.log("📍 FINAL_DROPOFF_ADDRESS:", payload.dropoff.address);
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
    if (io) {
      const payload = order.toObject();
      console.log("=========================================");
      console.log(`📡 EVENT_EMITTED: order:updated`);
      console.log(`📡 ORDER_ID: ${payload.orderNumber}`);
      console.log(`📡 EVENT_PAYLOAD:`, JSON.stringify(payload, null, 2));
      console.log("=========================================");
      io.emit("order:updated", payload);
    }

    return order;
  } catch (error) {
    console.log("ASSIGN DELIVERY FAILED:", error.message);
    logger.error("❌ [MARK READY] FAILED at assignDeliveryPartner:", {
      message: error.message,
      orderId
    });

    // Revert intermediate status on failure to allow retry
    try {
      const order = await Order.findById(orderId);
      if (order && order.delivery?.status === "ASSIGNING") {
        order.delivery.status = "FAILED";
        order.delivery.error = error.message;
        await order.save();
        
        // Emit Socket update to notify UI of failure
        const io = getIo();
        if (io) {
          io.emit("order:updated", order.toObject());
        }
      }
    } catch (dbErr) {
      console.error("Failed to revert delivery status:", dbErr.message);
    }

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
        if (io) {
          const payload = typeof order.toObject === "function" ? order.toObject() : order;
          console.log("=========================================");
          console.log(`📡 EVENT_EMITTED: order:updated`);
          console.log(`📡 ORDER_ID: ${payload.orderNumber}`);
          console.log(`📡 EVENT_PAYLOAD:`, JSON.stringify(payload, null, 2));
          console.log("=========================================");
          io.emit("order:updated", payload); // Matches frontend listener name
        }
        
        logger.info(`✅ Order ${order.orderNumber} is now READY. Waiting for rider.`);
      }
    } catch (err) {
      logger.error(`Error in automated READY transition for order ${orderId}:`, err);
    }
  }, ms);
};

/**
 * Syncs the status of all active Borzo delivery tasks by polling their latest
 * information from the provider API and updating the MongoDB records.
 * Solves Render server cold starts and webhook delivery issues.
 */
export const syncActiveOrders = async () => {
  try {
    const activeStatuses = ["PREPARING", "READY", "PICKED_UP"];
    const ordersToSync = await Order.find({
      status: { $in: activeStatuses },
      "delivery.providerOrderId": { $exists: true, $ne: "" }
    });

    if (ordersToSync.length === 0) return;

    console.log(`🔄 [SYNC] Checking status of ${ordersToSync.length} active delivery orders...`);

    for (const order of ordersToSync) {
      try {
        if (order.delivery && order.delivery.provider === "dunzo") {
          console.log(`🔄 [SYNC] Migrating legacy provider "dunzo" to "borzo" for Order ${order.orderNumber}`);
          order.delivery.provider = "borzo";
          await order.save();
        }

        const taskId = order.delivery.providerOrderId;
        const provider = order.delivery?.provider || "borzo";
        const task = await getTrackingDetails(taskId, { provider });
        
        if (!task || !task.status) continue;

        let event = "unknown";
        const rawStatus = task.status.toLowerCase();
        
        switch (rawStatus) {
          case "new":
            event = "order_created";
            break;
          case "available":
          case "searching_courier":
            event = "searching_courier";
            break;
          case "active":
          case "courier_assigned":
          case "assigned_for_delivery":
          case "accepted":
            event = "courier_assigned";
            break;
          case "courier_departed":
          case "picked_up":
          case "delivering":
          case "ofd":
          case "out_for_delivery":
            event = "picked_up";
            break;
          case "completed":
          case "finished":
          case "delivery_completed":
          case "delivery completed":
          case "delivered":
            event = "delivered";
            break;
          case "canceled":
          case "cancelled":
          case "cancelled_by_customer":
            event = "canceled";
            break;
          case "failed":
          case "failed_delivery":
          case "nc":
          case "na":
          case "lost":
            event = "failed_delivery";
            break;
        }

        let statusChanged = false;

        // Sync rider details if available
        const oldRider = order.rider || {};
        const newRider = task.rider || {};
        if (newRider.name && (newRider.name !== oldRider.name || newRider.phone !== oldRider.phone)) {
          order.rider = {
            name: newRider.name,
            phone: newRider.phone || oldRider.phone,
            vehicleNumber: newRider.vehicleNumber || oldRider.vehicleNumber
          };
          statusChanged = true;
          console.log(`🔄 [SYNC] Syncing rider details for Order ${order.orderNumber}: ${newRider.name}`);
        }

        // Map delivery status
        switch (event) {
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
          await order.save();
          console.log(`🔄 [SYNC] Order ${order.orderNumber} successfully auto-synced to ${order.status}/${order.delivery.status}`);
          
          // Emit socket update
          const io = getIo();
          if (io) {
            io.emit("order:updated", order.toObject());
          }
        }
      } catch (err) {
        console.error(`❌ [SYNC] Failed to sync order ${order.orderNumber}:`, err.message);
      }
    }
  } catch (error) {
    console.error("❌ [SYNC] Error in active orders synchronization:", error.message);
  }
};
