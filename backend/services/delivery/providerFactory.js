import { createBorzoProvider } from "./providers/borzoProvider.js";

const PROVIDERS = {
  borzo: createBorzoProvider
};

export const getDeliveryProvider = (providerName) => {
  const defaultProvider = process.env.DEFAULT_DELIVERY_PROVIDER || "borzo";
  const key = String(providerName || defaultProvider).toLowerCase().trim();
  const factory = PROVIDERS[key];

  if (!factory) {
    throw new Error(`Delivery provider '${key}' not found. Available: ${Object.keys(PROVIDERS).join(", ")}`);
  }

  return factory();
};
