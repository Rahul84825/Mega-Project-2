import axios from "axios";
import { logger } from "../../../utils/logger.js";

const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

const buildConfig = () => {
  const baseUrl = getEnv("SHADOWFAX_BASE_URL", "https://dale.staging.shadowfax.in/api");
  const authToken = getEnv("SHADOWFAX_API_KEY");

  if (!authToken) {
    logger.error("❌ SHADOWFAX_API_KEY is missing in environment variables");
    throw new Error("SHADOWFAX_API_KEY is required for Shadowfax integration");
  }

  return {
    baseUrl,
    authToken
  };
};

const buildHeaders = (config) => {
  return {
    "Content-Type": "application/json",
    "Authorization": `Token ${config.authToken}`
  };
};

const request = async (url, options = {}) => {
  const method = (options.method || "GET").toLowerCase();
  
  let logBody = options.body;
  if (typeof options.body === "string" && options.body.length > 0) {
    try {
      logBody = JSON.parse(options.body);
    } catch (e) {
      logBody = "[Non-JSON Body]";
    }
  }

  logger.info(`🌐 [SHADOWFAX] API Request: ${method.toUpperCase()} ${url}`, {
    headers: {
      ...options.headers,
      "Authorization": options.headers?.["Authorization"] ? "***HIDDEN***" : "MISSING"
    },
    body: logBody
  });

  try {
    const response = await axios({
      url,
      method,
      headers: options.headers,
      data: options.body,
      timeout: 15000
    });

    const data = response.data;

    logger.info(`📥 [SHADOWFAX] API Response: ${response.status}`, { 
      message: data?.message,
      errors: data?.errors
    });

    // Shadowfax often returns 200 even for some failures, checking message/errors
    if (data && data.message === "Failure") {
      const apiError = typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors);
      logger.error(`❌ [SHADOWFAX] API Validation Error:`, { error: apiError, details: data });
      throw new Error(`Shadowfax API Error: ${apiError}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes("Shadowfax API Error")) throw error;

    const status = error.response?.status;
    const responseData = error.response?.data;
    
    let apiError = error.message;
    if (responseData) {
      if (responseData.message) {
        apiError = responseData.message;
      } else if (responseData.errors) {
        apiError = JSON.stringify(responseData.errors);
      }
    }

    let errorType = "Network/HTTP Failure";
    if (status === 401 || status === 403) errorType = "Authentication Error";
    else if (status >= 500) errorType = "Server Error";
    else if (status >= 400) errorType = "API Client Error";

    logger.error(`❌ [SHADOWFAX] ${errorType}:`, { 
      status, 
      error: apiError,
      details: responseData,
      url: url
    });
    throw new Error(`Shadowfax ${errorType}: ${apiError}`);
  }
};

const normalizeTask = (data = {}) => {
  const order = data.data || data.order_details || {};
  return {
    taskId: String(order.awb_number || ""),
    status: order.status || "",
    rider: {
      name: "", // Will be updated via webhook or tracking details when OFD
      phone: "",
      vehicleNumber: ""
    },
    pickupOtp: "",
    trackingUrl: order.customer_track_url || "",
    eta: null
  };
};

export const createShadowfaxProvider = () => {
  const config = buildConfig();

  return {
    async createDeliveryTask(payload) {
      logger.info(`🛠️ [SHADOWFAX] Building payload for Order ${payload.orderNumber}`);

      // Shadowfax v3 Marketplace model requires specific structure
      const body = {
        order_type: "marketplace",
        order_details: {
          client_order_id: payload.orderNumber,
          actual_weight: Math.round(payload.totalWeightKg * 1000), // in gms
          product_value: payload.totalAmount || 0,
          payment_mode: "Prepaid", // Default to prepaid
          cod_amount: 0,
          total_amount: payload.totalAmount || 0,
          order_service: "regular"
        },
        customer_details: {
          name: payload.dropoff.name,
          contact: payload.dropoff.phone.replace(/\D/g, "").slice(-10),
          address_line_1: payload.dropoff.address,
          city: "Pune", // Defaulting to Pune as per Borzo logic
          state: "Maharashtra",
          pincode: parseInt(payload.dropoff.pincode),
          latitude: payload.dropoff.geo?.lat ? String(payload.dropoff.geo.lat) : "",
          longitude: payload.dropoff.geo?.lng ? String(payload.dropoff.geo.lng) : ""
        },
        pickup_details: {
          name: payload.pickup.name,
          contact: payload.pickup.phone.replace(/\D/g, "").slice(-10),
          address_line_1: payload.pickup.address,
          city: "Pune",
          state: "Maharashtra",
          pincode: 411014, // Viman Nagar Pincode
          latitude: payload.pickup.geo?.lat ? String(payload.pickup.geo.lat) : "",
          longitude: payload.pickup.geo?.lng ? String(payload.pickup.geo.lng) : "",
          unique_code: "MW_VIMAN_NAGAR" // Warehouse code
        },
        rts_details: {
          name: payload.pickup.name,
          contact: payload.pickup.phone.replace(/\D/g, "").slice(-10),
          address_line_1: payload.pickup.address,
          city: "Pune",
          state: "Maharashtra",
          pincode: 411014,
          unique_code: "MW_VIMAN_NAGAR"
        },
        product_details: (payload.items || []).map(item => ({
          sku_name: item.name,
          price: item.price,
          additional_details: {
            quantity: item.quantity
          }
        }))
      };

      const data = await request(`${config.baseUrl}/v3/clients/orders/`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body)
      });

      const task = normalizeTask(data);
      logger.info(`✅ [SHADOWFAX] Task Created: ${task.taskId}, Status: ${task.status}`);
      return task;
    },

    async calculateDeliveryFee(payload) {
      // Shadowfax documentation doesn't explicitly show a 'calculate-fee' endpoint in the provided snippets.
      // Usually, serviceability is checked.
      // We'll return a placeholder or use a fixed rate if applicable, or check serviceability.
      // For now, mirroring Borzo's structure but Shadowfax might not have this.
      logger.warn("⚠️ [SHADOWFAX] Dynamic fee calculation not implemented (using fixed fee)");
      return {
        fee: 0,
        currency: "INR",
        provider: "shadowfax"
      };
    },

    async cancelDeliveryTask(taskId, payload = {}) {
      const data = await request(`${config.baseUrl}/v3/clients/orders/cancel/`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify({ 
          request_id: taskId,
          cancel_remarks: payload.reason || "Cancelled by admin" 
        })
      });

      return {
        taskId: taskId,
        status: "cancelled"
      };
    },

    async getTrackingDetails(taskId) {
      const data = await request(`${config.baseUrl}/v4/clients/orders/${taskId}/track/`, {
        method: "GET",
        headers: buildHeaders(config)
      });

      const task = normalizeTask(data);
      
      // Shadowfax tracking details might contain rider info if in 'ofd' status
      const latestTrack = data.tracking_details?.[data.tracking_details.length - 1];
      if (latestTrack && latestTrack.status_id === "ofd") {
        // Rider info is usually in the webhook, but let's check if it's here
        // Tracking details in doc don't show rider_name, but webhook does.
      }
      
      return task;
    },

    parseWebhook(payload) {
      const rawOrderId = String(payload.order_id || "").trim();
      const rawAwb = String(payload.awb_number || "").trim();
      const rawStatus = String(payload.event || "").toLowerCase();
      const riderName = payload.rider_name || "";
      const riderPhone = payload.rider_contact || "";

      let event = "unknown";
      
      switch (rawStatus) {
        case "new":
          event = "order_created";
          break;
        case "assigned_for_delivery":
          event = "courier_assigned";
          break;
        case "picked":
          event = "picked_up";
          break;
        case "ofd":
          event = "picked_up"; // Mapping ofd to picked_up to fit existing internal statuses
          break;
        case "delivered":
          event = "delivered";
          break;
        case "cancelled_by_customer":
        case "cancelled_by_seller":
          event = "canceled";
          break;
      }

      return {
        provider: "shadowfax",
        taskId: rawAwb || rawOrderId,
        status: rawStatus,
        event,
        rider: {
          name: riderName,
          phone: riderPhone,
          vehicleNumber: ""
        },
        trackingUrl: "", // Webhook doesn't usually include this
        raw: payload
      };
    }
  };
};
