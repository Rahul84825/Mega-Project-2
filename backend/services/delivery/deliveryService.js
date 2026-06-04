import { createBorzoProvider } from "./providers/borzoProvider.js";
import { createShadowfaxProvider } from "./providers/shadowfaxProvider.js";

const getProvider = () => {
  const selectedProvider = (process.env.DELIVERY_PROVIDER || "borzo").toLowerCase();
  
  console.log("=========================================");
  console.log(`🚚 ACTIVE_DELIVERY_PROVIDER: ${selectedProvider.toUpperCase()}`);
  console.log(`🚚 RUNTIME_ENV_VALUE: ${process.env.DELIVERY_PROVIDER || "NOT_SET"}`);
  console.log("=========================================");

  if (selectedProvider === "shadowfax") {
    return createShadowfaxProvider();
  }
  
  // Default to Borzo
  return createBorzoProvider();
};

const provider = getProvider();

export const createDeliveryTask = async (payload) => {
  return provider.createDeliveryTask(payload);
};

export const cancelDeliveryTask = async (taskId) => {
  return provider.cancelDeliveryTask(taskId);
};

export const getTrackingDetails = async (taskId) => {
  return provider.getTrackingDetails(taskId);
};

export const calculateDeliveryFee = async (payload) => {
  return provider.calculateDeliveryFee(payload);
};

export const handleDeliveryWebhook = async (payload) => {
  return provider.parseWebhook(payload);
};
