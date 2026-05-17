const getEnv = (key, fallback = "") => String(process.env[key] || fallback).trim();

const buildConfig = () => {
  const baseUrl = getEnv("DUNZO_BASE_URL", "https://api.dunzo.in");
  const apiKey = getEnv("DUNZO_API_KEY");
  const clientId = getEnv("DUNZO_CLIENT_ID");

  if (!apiKey) {
    throw new Error("DUNZO_API_KEY is required for Dunzo integration");
  }

  return {
    baseUrl,
    apiKey,
    clientId
  };
};

const buildHeaders = (config) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`
  };

  if (config.clientId) {
    headers["X-Client-Id"] = config.clientId;
  }

  return headers;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `Dunzo request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const normalizeTask = (data = {}) => {
  return {
    taskId: data.task_id || data.id || "",
    rider: {
      name: data.rider?.name || data.runner?.name || "",
      phone: data.rider?.phone || data.runner?.phone || ""
    },
    pickupOtp: data.pickup_otp || data.pickupOtp || "",
    trackingUrl: data.tracking_url || data.trackingUrl || "",
    eta: data.eta || data.estimated_arrival || null
  };
};

export const createDunzoProvider = () => {
  const config = buildConfig();

  return {
    async createDeliveryTask(payload) {
      const body = {
        order_reference: payload.orderNumber,
        pickup: payload.pickup,
        dropoff: payload.dropoff,
        items: payload.items,
        notes: payload.notes || "",
        cash_on_delivery: payload.cashOnDeliveryAmount || 0,
        metadata: payload.metadata || {}
      };

      const data = await request(`${config.baseUrl}/delivery/tasks`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify(body)
      });

      return normalizeTask(data);
    },

    async cancelDeliveryTask(taskId, payload = {}) {
      const data = await request(`${config.baseUrl}/delivery/tasks/${taskId}/cancel`, {
        method: "POST",
        headers: buildHeaders(config),
        body: JSON.stringify({ reason: payload.reason || "Cancelled" })
      });

      return {
        taskId: data.task_id || taskId,
        status: data.status || "cancelled"
      };
    },

    async getTrackingDetails(taskId) {
      const data = await request(`${config.baseUrl}/delivery/tasks/${taskId}`, {
        method: "GET",
        headers: buildHeaders(config)
      });

      return normalizeTask(data);
    },

    parseWebhook(payload) {
      return {
        provider: "dunzo",
        event: payload?.event || "unknown",
        taskId: payload?.task_id || payload?.id || "",
        raw: payload
      };
    }
  };
};
