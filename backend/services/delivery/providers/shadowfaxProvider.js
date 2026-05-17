export const createShadowfaxProvider = () => {
  return {
    async createDeliveryTask() {
      throw new Error("Shadowfax integration is not configured");
    },
    async cancelDeliveryTask() {
      throw new Error("Shadowfax integration is not configured");
    },
    async getTrackingDetails() {
      throw new Error("Shadowfax integration is not configured");
    },
    parseWebhook(payload) {
      return {
        provider: "shadowfax",
        event: payload?.event || "unknown",
        taskId: payload?.taskId || "",
        raw: payload
      };
    }
  };
};
