import { getDeliveryProvider } from "./providerFactory.js";

const getProviderName = (provider) => {
  return String(provider || process.env.DEFAULT_DELIVERY_PROVIDER || "dunzo").trim();
};

export const createDeliveryTask = async (payload, options = {}) => {
  const provider = getDeliveryProvider(getProviderName(options.provider));
  return provider.createDeliveryTask(payload, options);
};

export const cancelDeliveryTask = async (taskId, options = {}) => {
  const provider = getDeliveryProvider(getProviderName(options.provider));
  return provider.cancelDeliveryTask(taskId, options);
};

export const getTrackingDetails = async (taskId, options = {}) => {
  const provider = getDeliveryProvider(getProviderName(options.provider));
  return provider.getTrackingDetails(taskId, options);
};

export const handleDeliveryWebhook = async (payload, options = {}) => {
  const provider = getDeliveryProvider(getProviderName(options.provider));
  if (typeof provider.parseWebhook !== "function") {
    return {
      event: "unknown",
      raw: payload
    };
  }

  return provider.parseWebhook(payload, options);
};
