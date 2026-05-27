import axios from "axios";
import AddressCache from "../models/AddressCache.js";
import { logger } from "../utils/logger.js";
import { STORE_LOCATION } from "../config/location.js";

/**
 * Validates if a coordinate is within the strict delivery radius.
 * (DISABLED for Phase 1 - Using Pincode Zones instead)
 * @param {number} lat 
 * @param {number} lng 
 * @throws {Error} If out of range
 */
export const validateDeliveryRadius = (lat, lng) => {
  logger.info("📍 Radius validation disabled in Phase 1. Pincode system is authoritative.");
  return 0;

  /*
  const distance = calculateHaversineDistance(
    STORE_LOCATION.lat,
    STORE_LOCATION.lng,
    lat,
    lng
  );
  ...
  */
};

/**
 * Calculate distance between two points using Haversine formula (Fast & Free)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in KM
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Geocode an address to coordinates using Google Maps API (DISABLED for Phase 1)
 * @param {string} address 
 * @returns {Object} { lat, lng, formattedAddress }
 */
export const geocodeAddress = async (address) => {
  const normalizedAddress = address.toLowerCase().trim();

  logger.info(`📍 Geocoding disabled in Phase 1. Using manual pincode system instead for: "${address}"`);
  
  // Return a mock result to avoid breaking any callers that expect coordinates
  // but indicate that geocoding did not actually happen.
  return { 
    lat: STORE_LOCATION.lat, 
    lng: STORE_LOCATION.lng, 
    formattedAddress: address,
    isManual: true 
  };

  /* 
  // ── FUTURE: RESTORE GOOGLE GEOCODING ──
  // 1. Check Cache First
  try {
    const cached = await AddressCache.findOne({ fullAddress: normalizedAddress });
    ...
  */
};
