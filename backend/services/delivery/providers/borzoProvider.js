import axios from "axios";
import { logger } from "../../../utils/logger.js";

const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

const buildConfig = () => {
  let baseUrl = getEnv("BORZO_BASE_URL", "https://robot-in.borzodelivery.com/api/business/1.6");
  const authToken = getEnv("BORZO_API_TOKEN");

  // ── URL NORMALIZATION: Fix common hostname typos for India ──
  // Borzo India (Wefast) requires -in (production) or -apitest-in (test) subdomains.
  // If the user provided the global 'robot.borzodelivery.com' but is in the India context,
  // we automatically correct it to prevent ENOTFOUND errors.
  if (baseUrl.includes("robot.borzodelivery.com")) {
    console.log("⚠️ [BORZO] Normalizing global URL to India-specific subdomain (-in)");
    baseUrl = baseUrl.replace("robot.borzodelivery.com", "robot-in.borzodelivery.com");
  }

  // console.log("BORZO TOKEN EXISTS:", !!authToken);
  // console.log("BORZO BASE URL:", baseUrl);

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
  console.log("STEP_REACHED: Borzo API request");
  console.log(`🌐 [BORZO] URL: ${url}`);
  console.log(`🌐 [BORZO] Payload:`, JSON.stringify(logBody, null, 2));
  
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
    console.log("STEP_REACHED: Borzo API response");
    console.log(`📥 [BORZO] Status: ${response.status}`);
    console.log(`📥 [BORZO] Body:`, JSON.stringify(data, null, 2));

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
      phone: order.courier?.phone || "",
      vehicleNumber: order.courier?.car_number || ""
    },
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
      console.log("STEP_REACHED: borzoProvider.createDeliveryTask");
      logger.info(`🛠️ [BORZO] Building payload for Order ${payload.orderNumber}`);

      // Borzo India v1.6 format requirements:
      // - total_weight_kg: must be numeric
      
      const rawWeight = payload.totalWeightKg;
      // Use nullish coalescing to avoid defaulting to 1 when weight is a valid number (even 0.1)
      const weightValue = (rawWeight !== undefined && rawWeight !== null) ? rawWeight : 1;
      const finalWeight = Number(parseFloat(weightValue).toFixed(3));
      const vehicleTypeId = payload.vehicleTypeId || 8;

      const body = {
        type: "standard",
        matter: `Mithai Order ${payload.orderNumber}`,
        points: [
          {
            address: payload.pickup.address,
            latitude: payload.pickup.geo?.lat || null,
            longitude: payload.pickup.geo?.lng || null,
            contact_person: {
              phone: sanitizePhone(payload.pickup.phone),
              name: payload.pickup.name || "Mithai World"
            },
            note: payload.pickup.note || "Pickup from Mithai World store"
          },
          {
            address: payload.dropoff.address,
            latitude: payload.dropoff.geo?.lat || null,
            longitude: payload.dropoff.geo?.lng || null,
            contact_person: {
              phone: sanitizePhone(payload.dropoff.phone),
              name: payload.dropoff.name || "Customer"
            },
            note: [payload.dropoff.landmark, payload.dropoff.note].filter(Boolean).join(" | ") || ""
          }
        ],
        vehicle_type_id: vehicleTypeId, 
        is_route_optimizer_enabled: true,
        total_weight_kg: finalWeight
      };

      logger.info(`📤 [BORZO] FINAL PAYLOAD VERIFICATION:`, { 
        orderNumber: payload.orderNumber,
        formattedWeightSent: body.total_weight_kg,
        points: body.points.map(p => ({ addr: p.address, lat: p.latitude, lng: p.longitude }))
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
      const weightValue = (rawWeight !== undefined && rawWeight !== null) ? rawWeight : 1;
      const finalWeight = Number(parseFloat(weightValue).toFixed(3));
      const vehicleTypeId = payload.vehicleTypeId || 8;

      const body = {
        type: "standard",
        points: [
          { 
            address: payload.pickup.address,
            latitude: payload.pickup.geo?.lat || null,
            longitude: payload.pickup.geo?.lng || null
          },
          { 
            address: payload.dropoff.address,
            latitude: payload.dropoff.geo?.lat || null,
            longitude: payload.dropoff.geo?.lng || null
          }
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
      // Borzo webhook can be nested: { order: { order_id, status, ... } }
      // Or root-level: { order_id, status, ... }
      const nestedOrder = payload.order || {};
      
      // Normalize extraction
      const rawOrderId = String(nestedOrder.order_id || payload.order_id || "").trim();
      const rawStatus = String(nestedOrder.status || payload.status || "").toLowerCase();
      const points = nestedOrder.points || payload.points || [];
      const courier = nestedOrder.courier || payload.courier || {};
      const trackingUrl = nestedOrder.tracking_url || payload.tracking_url || "";

      let event = "unknown";
      
      /**
       * ── CENTRALIZED BORZO STATUS MAP ──
       * Correctly maps all possible Borzo India statuses to internal lifecycle events.
       */
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
          event = "courier_assigned";
          // If the first point (pickup) is completed, it means it's picked up
          if (points.length > 0 && points[0].completed_datetime) {
            event = "picked_up";
          }
          break;
        case "courier_departed":
        case "picked_up":
        case "delivering":
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
          event = "canceled";
          break;
        case "failed":
        case "failed_delivery":
          event = "failed_delivery";
          break;
        default:
          event = `borzo_${rawStatus}`; // Fallback
      }

      return {
        provider: "borzo",
        taskId: rawOrderId,
        status: rawStatus,
        event,
        rider: {
          name: courier.name || "",
          phone: courier.phone || "",
          vehicleNumber: courier.vehicle_number || courier.car_number || ""
        },
        trackingUrl,
        raw: payload
      };
    }
  };
};
