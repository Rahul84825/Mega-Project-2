/**
 * Centralized location configuration for the store
 */
export const STORE_LOCATION = {
  address: "Mithai World, Viman Nagar, Pune, Maharashtra 411014",
  lat: 18.5679,
  lng: 73.9143,
  radiusLimitKm: 15,
  operationalLimitKm: 14.5, // Safety buffer to reduce GPS edge-case losses
  pincode: "411014"
};

/**
 * Internal delivery pricing tiers based on distance
 */
export const DELIVERY_PRICING_TIERS = [
  { maxKm: 5, fee: 40 },
  { maxKm: 10, fee: 60 },
  { maxKm: 15, fee: 80 }
];
