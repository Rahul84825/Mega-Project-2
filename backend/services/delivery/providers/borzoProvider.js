import axios from "axios";
import { logger } from "../../../utils/logger.js";

const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

const buildConfig = () => {
  const baseUrl = getEnv("BORZO_BASE_URL", "https://robot-in.borzodelivery.com/api/business/1.6");
  const authToken = getEnv("BORZO_API_TOKEN");

  if (!authToken) {
    logger.error("❌ BORZO_API_TOKEN is missing in environment variables");
    throw new Error("BORZO_API_TOKEN is required for Borzo integration");
  }

  return {
    baseUrl,
    authToken
  };
};

const buildHeaders = (config) => {
  return {
    "Content-Type": "application/json",
    "X-DV-Auth-Token": config.authToken
  };
};

const request = async (url, options = {}) => {
  const method = (options.method || "GET").toLowerCase();
  const body = options.body ? JSON.parse(options.body) : undefined;

  // LOGGING: Full outgoing request
  logger.info(`🌐 Borzo API Request: ${method.toUpperCase()} ${url}`, {
    headers: options.headers,
    body: body
  });

  try {
    const response = await axios({
      url,
      method,
      headers: options.headers,
      data: body,
      timeout: 15000 // 15 second timeout for delivery APIs
    });

    const data = response.data;

    // LOGGING: Full API response
    logger.info(`📥 Borzo API Response: ${response.status}`, { data });

    // Borzo India v1.6 sometimes returns 200 OK even for validation errors
    if (data && data.is_successful === false) {
      const apiError = data?.errors?.[0] || data?.message || "Validation failed";
      const paramErrors = data?.parameter_errors ? JSON.stringify(data.parameter_errors) : "None";
      logger.error(`❌ Borzo Validation Error:`, { 
        error: apiError,
        paramErrors: data.parameter_errors,
        details: data 
      });
      throw new Error(`Borzo API Error: ${apiError}. Details: ${paramErrors}`);
    }

    return data;
  } catch (error) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const apiError = responseData?.errors?.[0]?.text || responseData?.message || error.message;

    logger.error(`❌ Borzo API Call Failed:`, { 
      status, 
      error: apiError,
      details: responseData,
      url: url
    });
    throw new Error(`Borzo API Error: ${apiError}`);
  }
};

const normalizeTask = (data = {}) => {
  const order = data.order || {};
  return {
    taskId: String(order.order_id || ""),
    status: order.status || "",
    rider: {
      name: order.courier?.name || "",
      phone: order.courier?.phone || ""
    },
    pickupOtp: "", // Borzo usually doesn't use pickup OTP in basic flow
    trackingUrl: order.tracking_url || "",
    eta: order.courier_arrival_time_at_pickup || null
  };
};

// Helper: Sanitize phone numbers for Borzo India (Exactly 10 digits preferred)
const sanitizePhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  // Borzo India localized API typically expects 10-digit mobile numbers
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

export const createBorzoProvider = () => {
  const config = buildConfig();

  return {
    async createDeliveryTask(payload) {
      // payload usually contains orderNumber, pickup, dropoff, items, etc.
      // Borzo India v1.6 format:
      // {
      //   "type": "standard",
      //   "matter": "...",
      //   "points": [ { "address": "...", "contact_person": {...} }, ... ]
      // }

      const body = {
        type: "standard",
        matter: `Mithai Order ${payload.orderNumber}`,
        client_order_id: payload.orderNumber, // Added for dashboard tracking
        points: [
          {
            address: payload.pickup.address,
            contact_person: {
              phone: sanitizePhone(payload.pickup.phone),
              name: payload.pickup.name || "Mithai World"
            },
            note: payload.pickup.note || "Pickup from Mithai World store"
          },
          {
            address: payload.dropoff.address,
            contact_person: {
              phone: sanitizePhone(payload.dropoff.phone),
              name: payload.dropoff.name || "Customer"
            },
            note: payload.dropoff.note || ""
          }
        ],
        vehicle_type_id: payload.vehicleTypeId || 8, // 8 is Motorbike in India
        is_route_optimizer_enabled: true,
        total_weight_kg: 1
      };

      const data = await request(`${config.baseUrl}/create-order`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body)
      });

      return normalizeTask(data);
    },

    async cancelDeliveryTask(taskId, payload = {}) {
      const data = await request(`${config.baseUrl}/cancel-order`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify({ 
          order_id: taskId,
          reason: payload.reason || "Cancelled by admin" 
        })
      });

      return {
        taskId: taskId,
        status: "cancelled"
      };
    },

    async getTrackingDetails(taskId) {
      // Borzo uses orders endpoint for status
      const data = await request(`${config.baseUrl}/orders?order_id=${taskId}`, {
        method: "GET",
        headers: buildHeaders(config)
      });

      // orders endpoint returns a list
      const orderData = data.orders?.[0] || {};
      return normalizeTask({ order: orderData });
    },

    parseWebhook(payload) {
      // Borzo webhook format: { order: { order_id, status, ... } }
      const order = payload.order || {};
      const status = order.status;
      
      let event = "unknown";
      // Borzo India Statuses: new, available (searching), active (assigned), completed, canceled, delayed
      if (status === "new") event = "order_created";
      if (status === "available") event = "searching_courier"; 
      if (status === "active") event = "courier_assigned"; // Map active to assigned
      if (status === "completed") event = "delivered";
      if (status === "canceled") event = "canceled";
      if (status === "delayed") event = "failed_delivery";

      return {
        provider: "borzo",
        event,
        taskId: String(order.order_id || ""),
        status,
        rider: {
          name: order.courier?.name || "",
          phone: order.courier?.phone || ""
        },
        raw: payload
      };
    }
  };
};
