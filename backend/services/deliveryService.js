import { logger } from "../utils/logger.js";
import { getIo } from "../socket.js";
import Order from "../models/Order.js";

/**
 * MOCK LOGISTICS SERVICE (Simulating Shiprocket, Dunzo, Shadowfax, etc.)
 * Replace the internals of these functions with actual API calls to your chosen provider.
 */

// Simulates generating a 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// Simulates finding a nearby rider
const mockRiderProfiles = [
  { name: "Rahul Kumar", phone: "+91 9876543210", vehicleNumber: "MH 12 AB 1234" },
  { name: "Amit Singh", phone: "+91 8765432109", vehicleNumber: "MH 12 CD 5678" },
  { name: "Suresh Patil", phone: "+91 7654321098", vehicleNumber: "MH 12 EF 9012" }
];

export const assignDeliveryPartner = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    // Here you would make an API call to your delivery partner:
    // const response = await axios.post('https://api.shiprocket.in/v1/external/orders/create/adHoc', { ...orderData }, { headers });
    // const providerOrderId = response.data.order_id;
    
    // Simulating response
    const pickupOtp = generateOTP();
    const assignedRider = mockRiderProfiles[Math.floor(Math.random() * mockRiderProfiles.length)];

    order.delivery = {
      ...order.delivery,
      provider: "Shadowfax Mock",
      providerOrderId: `SFX-${Date.now()}`,
      trackingId: `TRK-${Math.floor(Math.random() * 1000000)}`,
      status: "ASSIGNED",
      assignedAt: new Date(),
      pickupOtp: pickupOtp
    };

    order.rider = assignedRider;
    await order.save();

    logger.info(`🚚 Delivery Partner Assigned for Order ${order.orderNumber}: Rider ${assignedRider.name}`);
    return order;
  } catch (error) {
    logger.error("Failed to assign delivery partner:", error);
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
        if (io) io.emit("orderUpdated", order); // Also matches standard order events
        
        logger.info(`✅ Order ${order.orderNumber} is now READY. Waiting for rider.`);
      }
    } catch (err) {
      logger.error(`Error in automated READY transition for order ${orderId}:`, err);
    }
  }, ms); // In a true production app, testing this might require small `ms` values (e.g., 5-10 secs instead of mins)
};
