import { createDunzoProvider } from "./providers/dunzoProvider.js";
import { createPorterProvider } from "./providers/porterProvider.js";
import { createShadowfaxProvider } from "./providers/shadowfaxProvider.js";

const PROVIDERS = {
  dunzo: createDunzoProvider,
  porter: createPorterProvider,
  shadowfax: createShadowfaxProvider
};

export const getDeliveryProvider = (providerName = "") => {
  const key = String(providerName || "").toLowerCase().trim();
  const factory = PROVIDERS[key];

  if (!factory) {
    throw new Error(`Unsupported delivery provider: ${providerName || "unknown"}`);
  }

  return factory();
};
