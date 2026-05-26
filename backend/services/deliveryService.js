import { logger } from "../utils/logger.js";
import { getIo } from "../socket.js";
import Order from "../models/Order.js";
import { createDeliveryTask, getTrackingDetails } from "./delivery/index.js";

/**
 * ASSIGN DELIVERY PARTNER
 * This function is called when an order is accepted.
 * It uses the unified delivery provider system to create a real task.
 */
export const assignDeliveryPartner = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    const provider = "borzo";

    // Prepare standardized payload for delivery providers
    const payload = {
      orderNumber: order.orderNumber,
      pickup: {
        address: "Mithai World, Viman Nagar, Pune", // Should be from config
        phone: "+91 98819 88751",
        name: "Mithai World"
      },
      dropoff: {
        address: `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`,
        phone: order.customer.phone,
        name: order.customer.name
      },
      items: order.items.map(item => ({
        name: item.titleSnapshot || item.name,
        quantity: item.quantity
      }))
    };

    logger.info(`🚚 Requesting ${provider} delivery for Order ${order.orderNumber}...`);

    const task = await createDeliveryTask(payload, { provider });

    order.delivery = {
      ...(order.delivery || {}),
      provider: provider,
      providerOrderId: task.taskId,
      trackingId: task.taskId,
      trackingUrl: task.trackingUrl,
      status: "ASSIGNED",
      assignedAt: new Date(),
      pickupOtp: task.pickupOtp || ""
    };

    if (task.rider?.name) {
      order.rider = {
        name: task.rider.name,
        phone: task.rider.phone,
        vehicleNumber: task.rider.vehicleNumber || ""
      };
    }

    await order.save();

    const io = getIo();
    if (io) io.emit("order:updated", order.toObject());

    logger.info(`✅ ${provider} Delivery Assigned: ${task.taskId}`);
    return order;
  } catch (error) {
    logger.error("❌ Failed to assign delivery partner:", error);
    // Don't crash the order flow, but log it
    // In production, you might want to notify an admin
    throw error;
  }
};

/**
 * Automates the transition from PREPARING to READY.
 * In a real-world scenario, you might use a message queue (like BullMQ, RabbitMQ, AWS SQS) 
 * to handle this asynchronously even if the server restarts. 
 * For simplicity here, we use setTimeout.
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
  }, ms); // In a true production app, testing this might require small `ms` values (e.g., 5-10 secs instead of mins)
};
