import { getDeliveryProvider } from "./providerFactory.js";

const getProviderName = (provider) => {
  let name = String(provider || process.env.DEFAULT_DELIVERY_PROVIDER || "borzo").trim().toLowerCase();
  if (name === "dunzo") {
    name = "borzo";
  }
  return name;
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

export const calculateDeliveryFee = async (payload, options = {}) => {
  const provider = getDeliveryProvider(getProviderName(options.provider));
  if (typeof provider.calculateDeliveryFee !== "function") {
    throw new Error(`calculateDeliveryFee not implemented for provider: ${getProviderName(options.provider)}`);
  }
  return provider.calculateDeliveryFee(payload, options);
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
