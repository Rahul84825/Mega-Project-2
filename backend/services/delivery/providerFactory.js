import { createBorzoProvider } from "./providers/borzoProvider.js";

const PROVIDERS = {
  borzo: createBorzoProvider
};

export const getDeliveryProvider = (providerName = "borzo") => {
  const key = "borzo"; // Force borzo
  const factory = PROVIDERS[key];

  if (!factory) {
    throw new Error(`Borzo provider not found`);
  }

  return factory();
};
