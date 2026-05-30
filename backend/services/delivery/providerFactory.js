import { createBorzoProvider } from "./providers/borzoProvider.js";

const PROVIDERS = {
  borzo: createBorzoProvider
};

export const getDeliveryProvider = (providerName) => {
  const defaultProvider = process.env.DEFAULT_DELIVERY_PROVIDER || "borzo";
  let key = String(providerName || defaultProvider).toLowerCase().trim();
  if (key === "dunzo") {
    key = "borzo";
  }
  let factory = PROVIDERS[key];

  if (!factory) {
    console.warn(`⚠️ [PROVIDER] Delivery provider '${key}' not found. Falling back to borzo.`);
    key = "borzo";
    factory = PROVIDERS[key];
  }

  return factory();
};
