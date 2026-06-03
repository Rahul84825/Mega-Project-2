import axios from "axios";
import { logger } from "../../../utils/logger.js";

const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

const buildConfig = () => {
  const baseUrl = getEnv("SHADOWFAX_BASE_URL", "https://dale.staging.shadowfax.in/api");
  const apiKey = getEnv("SHADOWFAX_API_KEY");

  if (!apiKey) {
    logger.error("❌ SHADOWFAX_API_KEY is missing in environment variables");
    // We don't throw here to allow the factory to at least create the object, 
    // but actual calls will fail.
  }

  return {
    baseUrl,
    apiKey
  };
};

const buildHeaders = (config) => {
  return {
    "Content-Type": "application/json",
    "Authorization": `Token ${config.apiKey}`
  };
};

const request = async (url, options = {}) => {
  const method = (options.method || "GET").toLowerCase();
  
  logger.info(`🌐 [SHADOWFAX] API Request: ${method.toUpperCase()} ${url}`, {
    body: options.body
  });

  try {
    const response = await axios({
      url,
      method,
      headers: options.headers,
      data: options.body,
      timeout: 15000
    });

    logger.info(`📥 [SHADOWFAX] API Response: ${response.status}`);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    
    logger.error(`❌ [SHADOWFAX] API Error:`, { 
      status, 
      error: error.message,
      details: responseData
    });
    const errorDetail = responseData ? JSON.stringify(responseData) : error.message;
    throw new Error(`Shadowfax API Error: ${error.message} - Details: ${errorDetail}`);
  }
};

export const createShadowfaxProvider = () => {
  const config = buildConfig();

  return {
    async createDeliveryTask(payload) {
      console.log("🚀 [SHADOWFAX_CREATE_START]", { orderNumber: payload.orderNumber });
      
      if (!config.apiKey) {
        console.error("❌ [SHADOWFAX_CREATE_FAILED] Missing API Key");
        throw new Error("SHADOWFAX_API_KEY is required for Shadowfax integration");
      }

      logger.info(`🛠️ [SHADOWFAX] Building payload for Order ${payload.orderNumber}`);

      const body = {
        order_details: {
          client_order_number: payload.orderNumber,
          order_type: "DELIVERY",
          price: payload.totalAmount || 0,
          payment_mode: "PREPAID",
          actual_weight: payload.totalWeightKg,
          weight: payload.totalWeightKg,
          callback_url: `${process.env.BASE_URL || ""}/api/delivery/webhook/shadowfax`
        },
        pickup_details: {
          name: payload.pickup.name,
          contact_number: payload.pickup.phone,
          address_line_1: payload.pickup.address,
          city: "Pune",
          state: "Maharashtra",
          pincode: "411014",
          latitude: payload.pickup.geo?.lat,
          longitude: payload.pickup.geo?.lng
        },
        delivery_details: {
          name: payload.dropoff.name,
          contact_number: payload.dropoff.phone,
          address_line_1: payload.dropoff.address,
          address_line_2: payload.dropoff.landmark || "",
          pincode: payload.dropoff.pincode,
          city: "Pune",
          state: "Maharashtra",
          latitude: payload.dropoff.geo?.lat,
          longitude: payload.dropoff.geo?.lng
        },
        order_items: payload.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const url = `${config.baseUrl}/v2/orders/`;
      console.log("📡 [SHADOWFAX_REQUEST_URL]:", url);
      console.log("📦 [SHADOWFAX_REQUEST_BODY]:", JSON.stringify(body, null, 2));

      try {
        const data = await request(url, {
          method: "POST",
          headers: buildHeaders(config),
          body: JSON.stringify(body)
        });

        console.log("✅ [SHADOWFAX_CREATE_SUCCESS]", { taskId: data.data?.id || data.id });

        const shadowfaxOrder = data.data || data;
        return {
          taskId: String(shadowfaxOrder.id || shadowfaxOrder.client_order_number || ""),
          awbNumber: shadowfaxOrder.awb_number || "",
          status: "DELIVERY_ASSIGNED",
          trackingUrl: shadowfaxOrder.tracking_url || `https://track.shadowfax.in/track?order_id=${payload.orderNumber}`,
          rider: {
            name: "",
            phone: ""
          }
        };
      } catch (error) {
        console.error("❌ [SHADOWFAX_CREATE_FAILED]", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },

    async getTrackingDetails(taskId) {
      if (!config.apiKey) return {};

      const data = await request(`${config.baseUrl}/v2/orders/${taskId}/`, {
        method: "GET",
        headers: buildHeaders(config)
      });

      const order = data.data || data;
      return {
        taskId: String(order.id || ""),
        status: order.status || "",
        rider: {
          name: order.rider_name || "",
          phone: order.rider_phone || ""
        },
        trackingUrl: order.tracking_url || ""
      };
    },

    async cancelDeliveryTask(taskId) {
      const data = await request(`${config.baseUrl}/v2/orders/${taskId}/cancel/`, {
        method: "POST",
        headers: buildHeaders(config)
      });
      return { taskId, status: "cancelled" };
    },

    parseWebhook(payload) {
      // Shadowfax Push Callback Payload:
      // {
      //   "awb_number": "...",
      //   "order_id": "...",
      //   "status": "...",
      //   "rider_name": "...",
      //   "rider_contact": "...",
      //   ...
      // }
      
      const rawStatus = String(payload.status || "").toLowerCase();
      const taskId = String(payload.order_id || payload.client_order_number || "");
      
      let event = "unknown";

      /**
       * Mapping based on Phase 4 requirements:
       * assigned_for_delivery -> READY (courier_assigned)
       * ofd -> OUT_FOR_DELIVERY (picked_up)
       * delivered -> DELIVERED (delivered)
       * cancelled_by_customer -> CANCELLED (canceled)
       * nc / na -> DELIVERY_ATTEMPT_FAILED (failed_delivery)
       * lost -> LOST (failed_delivery)
       */
      switch (rawStatus) {
        case "assigned_for_delivery":
        case "accepted":
          event = "courier_assigned";
          break;
        case "ofd":
        case "out_for_delivery":
        case "picked_up":
          event = "picked_up";
          break;
        case "delivered":
          event = "delivered";
          break;
        case "cancelled_by_customer":
        case "cancelled":
          event = "canceled";
          break;
        case "nc":
        case "na":
        case "delivery_attempt_failed":
        case "lost":
          event = "failed_delivery";
          break;
      }

      return {
        provider: "shadowfax",
        taskId: taskId,
        status: rawStatus,
        event: event,
        rider: {
          name: payload.rider_name || "",
          phone: payload.rider_contact || "",
          vehicleNumber: ""
        },
        trackingUrl: payload.tracking_url || "",
        raw: payload
      };
    }
  };
};
