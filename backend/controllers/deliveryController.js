import { calculateDeliveryFee } from "../services/delivery/index.js";
import { geocodeAddress, calculateHaversineDistance, validateDeliveryRadius } from "../services/locationService.js";
import { STORE_LOCATION, DELIVERY_PRICING_TIERS } from "../config/location.js";
import { getZoneByPincode } from "../config/pincodeZones.js";
import { logger } from "../utils/logger.js";
import { getDeliveryConfig } from "../../shared/utils/pricing.js";

/**
 * Check delivery availability and calculate internal fee
 * Deterministic Pincode-Zone Engine (Phase 1).
 * POST /api/delivery/check-availability
 */
export const checkAvailability = async (req, res) => {
  try {
    const { pincode } = req.body;

    if (!pincode || String(pincode).length !== 6) {
      return res.status(200).json({
        success: true,
        deliveryAvailable: false,
        message: "Please enter a valid 6-digit pincode."
      });
    }

    const zone = getZoneByPincode(pincode);
    const config = getDeliveryConfig(pincode);

    if (config.outOfReach) {
      logger.warn(`🛑 [DELIVERY REJECTED] Pincode ${pincode} is not serviceable.`);
      return res.status(200).json({
        success: true,
        deliveryAvailable: false,
        message: "Sorry, we currently do not deliver to this location."
      });
    }

    if (!zone || !zone.available) {
      logger.warn(`🛑 [DELIVERY REJECTED] Pincode ${pincode} is not in service area.`);
      return res.status(200).json({
        success: true,
        deliveryAvailable: false,
        message: "Delivery unavailable for this pincode."
      });
    }

    logger.info(`✅ [DELIVERY APPROVED] Pincode: ${pincode}, Area: ${zone.area}, Fee: ${config.charge}`);

    return res.status(200).json({
      success: true,
      deliveryAvailable: true,
      area: zone.area,
      city: zone.city,
      deliveryFee: config.charge,
      eta: zone.eta,
      pincode: pincode
    });
  } catch (error) {
    logger.error("❌ Delivery availability check failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to check delivery availability"
    });
  }
};

/**
 * Calculate dynamic delivery fee from provider (Borzo)
 * POST /api/delivery/calculate
 */
export const calculateDelivery = async (req, res) => {
  try {
    const { dropoff, vehicleTypeId = 8, totalWeightKg = 1 } = req.body;

    if (!dropoff || !dropoff.address) {
      return res.status(400).json({
        success: false,
        message: "Dropoff address is required"
      });
    }

    const payload = {
      pickup: {
        address: "Mithai World, Viman Nagar, Pune, Maharashtra 411014, India"
      },
      dropoff: {
        address: dropoff.address
      },
      vehicleTypeId,
      totalWeightKg
    };

    logger.info("🚚 Calculating dynamic delivery fee", { payload });

    const result = await calculateDeliveryFee(payload);

    return res.status(200).json({
      success: true,
      calculation: result
    });
  } catch (error) {
    logger.error("❌ Failed to calculate delivery fee:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate delivery fee"
    });
  }
};
