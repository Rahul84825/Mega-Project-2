import { logger } from "../utils/logger.js";
import { getIo } from "../socket.js";
import Order from "../models/Order.js";
import { createDeliveryTask, getTrackingDetails, handleDeliveryWebhook } from "./delivery/index.js";
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
  
  if (numeric < 10) return numeric * quantity;
  return (numeric / 1000) * quantity; // Assume grams for larger numbers without units
};

/**
 * Normalizes shipping address and geocodes it offline using GIS logic.
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

  const line1 = String(addr.line1 || "").trim();
  const line2 = String(addr.line2 || "").trim();
  const landmark = String(addr.landmark || "").trim();
  const city = String(addr.city || "Pune").trim();
  const state = String(addr.state || "Maharashtra").trim();
  const pincode = String(addr.postalCode || "").trim();

  const addressParts = [];
  if (line1) addressParts.push(line1);
  if (line2) addressParts.push(line2);
  if (landmark) addressParts.push(`Near ${landmark}`);
  addressParts.push(city);
  addressParts.push(state);
  if (pincode) addressParts.push(pincode);
  addressParts.push("India");

  const normalizedAddress = addressParts.join(", ");

  // Simple static geocoding for Pune zones
  let lat = 18.5204;
  let lng = 73.8567;

  if (pincode === "411014" || normalizedAddress.toLowerCase().includes("viman nagar")) {
    lat = 18.5626; lng = 73.9087;
  } else if (pincode === "411006" || normalizedAddress.toLowerCase().includes("yerwada")) {
    lat = 18.5529; lng = 73.8796;
  } else if (pincode === "411001" || normalizedAddress.toLowerCase().includes("pune camp")) {
    lat = 18.5135; lng = 73.8789;
  } else if (pincode === "411047" || normalizedAddress.toLowerCase().includes("lohegaon")) {
    lat = 18.5910; lng = 73.9189;
  } else if (pincode === "411032" || normalizedAddress.toLowerCase().includes("tingre nagar")) {
    lat = 18.5746; lng = 73.9038;
  }

  return { normalizedAddress, lat, lng, landmark };
};

/**
 * ASSIGN DELIVERY PARTNER (Borzo)
 */
export const assignDeliveryPartner = async (orderId) => {
  console.log("STEP_REACHED: assignDeliveryPartner");
  logger.info(`🚚 [MARK READY] STEP 4 - ASSIGN DELIVERY CALLED for Order: ${orderId} (Provider: Borzo)`);
  
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      logger.error(`❌ [MARK READY] FAILED - Order ${orderId} not found`);
      throw new Error("Order not found");
    }

    // Idempotency check
    if (order.delivery?.status === "ASSIGNING" || (order.delivery?.providerOrderId && order.delivery.providerOrderId.trim() !== "")) {
      logger.warn(`⚠️ [MARK READY] SKIPPED - Delivery task already exists for Order ${order.orderNumber}`);
      return order;
    }

    // Set intermediate state
    order.delivery = order.delivery || {};
    order.delivery.status = "ASSIGNING";
    await order.save();

    logger.info(`📡 [MARK READY] CALLING BORZO NOW for Order ${order.orderNumber}`);

    // Pincode validation
    const pincode = order.shippingAddress?.postalCode;
    const zone = getZoneByPincode(pincode);
    if (!zone || !zone.available) {
      const errorMsg = `Pincode ${pincode} is not in allowed delivery zones.`;
      order.delivery.status = "FAILED";
      order.delivery.error = errorMsg;
      await order.save();
      throw new Error(errorMsg);
    }

    // Weight calculation
    const totalWeightKg = order.items.reduce((sum, item) => {
      const itemWeight = parseWeightToKg(item.selectedVariant?.weight, item.quantity);
      return sum + itemWeight;
    }, 0);
    const finalWeight = Math.max(0.1, totalWeightKg);

    const normalizedRes = normalizeAndGeocodeAddress(order.shippingAddress);

    const payload = {
      orderNumber: order.orderNumber,
      totalWeightKg: finalWeight,
      pickup: {
        address: "Mithai World, Viman Nagar, Pune, Maharashtra 411014, India",
        phone: "9881988751",
        name: "Mithai World",
        geo: { lat: 18.5679, lng: 73.9143 }
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

    logger.info(`📡 [MARK READY] STEP 5 - BORZO API REQUEST for Order ${order.orderNumber}`);
    
    const task = await createDeliveryTask(payload);
    
    if (!task || !task.taskId) {
      throw new Error(`Borzo failed to return a task ID`);
    }

    order.delivery = {
      ...(order.delivery || {}),
      provider: "borzo",
      providerOrderId: task.taskId,
      trackingId: task.taskId,
      trackingUrl: task.trackingUrl || "",
      status: task.rider?.name ? "RIDER_ASSIGNED" : "DELIVERY_ASSIGNED",
      assignedAt: new Date()
    };

    if (task.rider?.name) {
      order.rider = {
        name: task.rider.name,
        phone: task.rider.phone,
        vehicleNumber: task.rider.vehicleNumber || ""
      };
    }

    await order.save();
    logger.info(`💾 [MARK READY] STEP 7 - BORZO DELIVERY SAVED`);

    const io = getIo();
    if (io) {
      io.emit("order:updated", order.toObject());
    }

    return order;
  } catch (error) {
    logger.error(`❌ [MARK READY] FAILED at assignDeliveryPartner (Borzo):`, error.message);
    try {
      const order = await Order.findById(orderId);
      if (order && order.delivery?.status === "ASSIGNING") {
        order.delivery.status = "FAILED";
        order.delivery.error = error.message;
        await order.save();
        const io = getIo();
        if (io) io.emit("order:updated", order.toObject());
      }
    } catch (dbErr) {}
    throw error;
  }
};

/**
 * Automates transition to READY
 */
export const scheduleOrderReady = (orderId, etaMinutes) => {
  setTimeout(async () => {
    try {
      const order = await Order.findById(orderId);
      if (order && order.status === "PREPARING") {
        order.status = "READY";
        order.statusTimestamps.readyForPickupAt = new Date();
        order.preparation.readyBy = new Date();
        await order.save();
        const io = getIo();
        if (io) io.emit("order:updated", order.toObject());
      }
    } catch (err) {}
  }, etaMinutes * 60 * 1000);
};

/**
 * SYNC ACTIVE ORDERS (Borzo)
 */
export const syncActiveOrders = async () => {
  try {
    const activeStatuses = ["PREPARING", "READY", "PICKED_UP"];
    const ordersToSync = await Order.find({
      status: { $in: activeStatuses },
      "delivery.providerOrderId": { $exists: true, $ne: "" },
      "delivery.provider": "borzo"
    });

    if (ordersToSync.length === 0) return;

    logger.info(`🔄 [SYNC] Checking status of ${ordersToSync.length} active Borzo orders...`);

    for (const order of ordersToSync) {
      try {
        const taskId = order.delivery.providerOrderId;
        
        const task = await getTrackingDetails(taskId);
        if (!task || !task.status) continue;

        const result = await handleDeliveryWebhook({ order: { order_id: taskId, status: task.status, courier: task.rider } });

        if (!result || result.event === "unknown") continue;

        let statusChanged = false;

        // Sync rider
        if (result.rider?.name && (!order.rider?.name || result.rider.name !== order.rider.name)) {
          order.rider = {
            name: result.rider.name,
            phone: result.rider.phone || order.rider?.phone,
            vehicleNumber: result.rider.vehicleNumber || order.rider?.vehicleNumber
          };
          statusChanged = true;
        }

        // Map status (same logic as webhook)
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
      } catch (err) {
        logger.error(`❌ [SYNC] Error syncing order ${order.orderNumber}:`, err.message);
      }
    }
  } catch (error) {
    logger.error("❌ [SYNC] Fatal error in syncActiveOrders:", error.message);
  }
};
