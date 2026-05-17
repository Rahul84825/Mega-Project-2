export const createPorterProvider = () => {
  return {
    async createDeliveryTask() {
      throw new Error("Porter integration is not configured");
    },
    async cancelDeliveryTask() {
      throw new Error("Porter integration is not configured");
    },
    async getTrackingDetails() {
      throw new Error("Porter integration is not configured");
    },
    parseWebhook(payload) {
      return {
        provider: "porter",
        event: payload?.event || "unknown",
        taskId: payload?.taskId || "",
        raw: payload
      };
    }
  };
};
