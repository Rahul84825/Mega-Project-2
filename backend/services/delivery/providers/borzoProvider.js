import axios from "axios";
import { logger } from "../../../utils/logger.js";

const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

console.log("BORZO PROVIDER HIT");

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
  
  // Safe body parsing for logging
  let logBody = options.body;
  if (typeof options.body === "string" && options.body.length > 0) {
    try {
      logBody = JSON.parse(options.body);
    } catch (e) {
      logBody = "[Non-JSON Body]";
    }
  }

  // ── LOGGING: Outgoing Request ──
  logger.info(`🌐 [BORZO] API Request: ${method.toUpperCase()} ${url}`, {
    headers: {
      ...options.headers,
      "X-DV-Auth-Token": options.headers?.["X-DV-Auth-Token"] ? "***HIDDEN***" : "MISSING"
    },
    body: logBody
  });

  try {
    logger.info(`📡 [BORZO] Executing axios call...`);
    const response = await axios({
      url,
      method,
      headers: options.headers,
      data: options.body, // Pass raw body (usually stringified JSON)
      timeout: 15000
    });

    const data = response.data;

    // ── LOGGING: API Response ──
    logger.info(`📥 [BORZO] API Response: ${response.status}`, { 
      isSuccessful: data?.is_successful,
      orderId: data?.order?.order_id,
      errors: data?.errors
    });

    if (data && data.is_successful === false) {
      const apiError = Array.isArray(data.errors) ? data.errors.join("; ") : (data.message || "Validation failed");
      const paramErrors = data.parameter_errors ? JSON.stringify(data.parameter_errors) : "None";
      
      // ── LOGGING: API Validation Error ──
      logger.error(`❌ [BORZO] API Validation Error:`, { 
        error: apiError,
        paramErrors: data.parameter_errors,
        details: data 
      });
      throw new Error(`Borzo API Error: ${apiError}. Details: ${paramErrors}`);
    }

    return data;
  } catch (error) {
    // If it's a Borzo API error we just threw, re-throw it
    if (error.message.includes("Borzo API Error")) throw error;

    const status = error.response?.status;
    const responseData = error.response?.data;
    
    let apiError = error.message;
    if (responseData) {
      if (Array.isArray(responseData.errors)) {
        apiError = responseData.errors.map(e => typeof e === 'string' ? e : (e.text || JSON.stringify(e))).join("; ");
      } else if (responseData.message) {
        apiError = responseData.message;
      }
    }

    // ── LOGGING: Network, Authentication, or Server Error ──
    let errorType = "Network/HTTP Failure";
    if (status === 401 || status === 403) errorType = "Authentication Error";
    else if (status >= 500) errorType = "Server Error";
    else if (status >= 400) errorType = "API Client Error";

    logger.error(`❌ [BORZO] ${errorType}:`, { 
      status, 
      error: apiError,
      details: responseData,
      url: url
    });
    throw new Error(`Borzo ${errorType}: ${apiError}`);
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
  // Remove all non-digits
  const digits = String(phone).replace(/\D/g, "");
  
  // Borzo India localized API typically expects 10-digit mobile numbers
  // If starts with 91 and has 12 digits, strip 91
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

export const createBorzoProvider = () => {
  const config = buildConfig();

  return {
    async createDeliveryTask(payload) {
      logger.info(`🛠️ [BORZO] Building payload for Order ${payload.orderNumber}`);

      // Borzo India v1.6 format requirements:
      // - total_weight_kg: must be numeric
      
      const rawWeight = payload.totalWeightKg;
      // Ensure numeric conversion and 3-decimal precision for hyperlocal accuracy (e.g. 100g = 0.100)
      const finalWeight = Number(parseFloat(rawWeight || 1).toFixed(3));
      const vehicleTypeId = payload.vehicleTypeId || 8;

      const body = {
        type: "standard",
        matter: `Mithai Order ${payload.orderNumber}`,
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
        vehicle_type_id: vehicleTypeId, 
        is_route_optimizer_enabled: true,
        total_weight_kg: finalWeight
      };

      logger.info(`📤 [BORZO] FINAL PAYLOAD VERIFICATION:`, { 
        orderNumber: payload.orderNumber,
        rawWeightIn: rawWeight,
        formattedWeightSent: body.total_weight_kg,
        weightType: typeof body.total_weight_kg,
        vehicleTypeId: body.vehicle_type_id
      });

      const data = await request(`${config.baseUrl}/create-order`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body)
      });

      const task = normalizeTask(data);
      logger.info(`✅ [BORZO] Task Created: ${task.taskId}, Status: ${task.status}`);
      return task;
    },

    async calculateDeliveryFee(payload) {
      // payload contains pickup and dropoff addresses
      const rawWeight = payload.totalWeightKg;
      const finalWeight = Number(parseFloat(rawWeight || 1).toFixed(3));
      const vehicleTypeId = payload.vehicleTypeId || 8;

      const body = {
        type: "standard",
        points: [
          { address: payload.pickup.address },
          { address: payload.dropoff.address }
        ],
        vehicle_type_id: vehicleTypeId,
        total_weight_kg: finalWeight
      };

      logger.info(`📤 [BORZO] Calculating Fee with verified weight:`, { 
        weight: body.total_weight_kg, 
        weightType: typeof body.total_weight_kg 
      });

      const data = await request(`${config.baseUrl}/calculate-order`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body)
      });

      if (data && data.is_successful) {
        logger.info(`📥 [BORZO] Fee Calculated: ${data.order.payment_amount} ${data.order.currency || "INR"}`);
        return {
          fee: parseFloat(data.order.payment_amount),
          currency: data.order.currency || "INR",
          provider: "borzo"
        };
      }
      throw new Error("Failed to calculate Borzo delivery fee");
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
      // Borzo webhook format: { order: { order_id, status, points: [...], ... } }
      const order = payload.order || {};
      const status = order.status;
      const points = order.points || [];
      
      let event = "unknown";
      // Borzo India Statuses: new, available (searching), active (assigned), completed, canceled, delayed
      if (status === "new") event = "order_created";
      if (status === "available") event = "searching_courier"; 
      
      if (status === "active") {
        event = "courier_assigned";
        // If the first point (pickup) is completed, it means it's picked up
        if (points.length > 0 && points[0].completed_datetime) {
          event = "picked_up";
        }
      }
      
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
