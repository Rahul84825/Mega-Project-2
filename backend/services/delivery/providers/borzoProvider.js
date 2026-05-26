const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

const buildConfig = () => {
  const baseUrl = getEnv("BORZO_BASE_URL", "https://robot.borzodelivery.com/api/business/1.1");
  const authToken = getEnv("BORZO_API_TOKEN");

  if (!authToken) {
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
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.errors?.[0]?.text || data?.message || `Borzo request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
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

export const createBorzoProvider = () => {
  const config = buildConfig();

  return {
    async createDeliveryTask(payload) {
      // payload usually contains orderNumber, pickup, dropoff, items, etc.
      // Borzo format:
      // {
      //   "matter": "...",
      //   "points": [ { "address": "...", "contact_person": {...} }, ... ]
      // }

      const body = {
        matter: `Order ${payload.orderNumber}`,
        points: [
          {
            address: payload.pickup.address,
            contact_person: {
              phone: payload.pickup.phone,
              name: payload.pickup.name || "Store"
            },
            note: payload.pickup.note || ""
          },
          {
            address: payload.dropoff.address,
            contact_person: {
              phone: payload.dropoff.phone,
              name: payload.dropoff.name || "Customer"
            },
            note: payload.dropoff.note || ""
          }
        ],
        vehicle_type_id: payload.vehicleTypeId || 8, // 8 is usually motorcycle
        is_route_optimizer_enabled: true
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
      if (status === "new") event = "order_created";
      if (status === "available") event = "courier_assigned";
      if (status === "active") event = "picked_up";
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
