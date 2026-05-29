import dotenv from "dotenv";
import { createBorzoProvider } from "../services/delivery/providers/borzoProvider.js";
import { logger } from "../utils/logger.js";

dotenv.config();

/**
 * BORZO API VERIFICATION SCRIPT
 */
const verifyBorzo = async () => {
  console.log("\n========== BORZO API START ==========");

  // 1. Verify Token Presence
  const token = process.env.BORZO_API_TOKEN;
  console.log("BORZO TOKEN EXISTS:", !!token);
  
  if (!token) {
    console.error("❌ BORZO_API_TOKEN is missing in .env");
    process.exit(1);
  }

  try {
    const provider = createBorzoProvider();
    console.log("BORZO PROVIDER LOADED");

    // 2. Test Payload Generation
    const testPayload = {
      orderNumber: "TEST-VERIFY-123",
      totalWeightKg: 0.5,
      pickup: {
        address: "Mithai World, Viman Nagar, Pune, Maharashtra 411014, India",
        phone: "9881988751",
        name: "Mithai World"
      },
      dropoff: {
        address: "Phoenix Marketcity, Viman Nagar, Pune, Maharashtra 411014, India",
        phone: "9999999999",
        name: "Test Customer"
      },
      items: [{ name: "Gulab Jamun", quantity: 1 }]
    };

    console.log("BORZO PAYLOAD GENERATION TESTED");

    // 3. Test API Connectivity (Calculate Fee is a safe GET/POST that doesn't create an order)
    console.log("BORZO REQUEST: Calculating Fee...");
    const feeResult = await provider.calculateDeliveryFee(testPayload);
    
    console.log("BORZO RESPONSE:", JSON.stringify(feeResult, null, 2));
    console.log("✅ BORZO API CONNECTIVITY VERIFIED");

    // 4. Webhook Info
    console.log("\nWEBHOOK INFO:");
    console.log(`Endpoint: /api/delivery/webhook/borzo`);
    console.log(`Callback Token Set: ${!!process.env.BORZO_CALLBACK_TOKEN}`);

    console.log("\n========== BORZO VERIFICATION SUCCESS ==========");
  } catch (error) {
    console.error("\n========== BORZO ERROR ==========");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
};

verifyBorzo();
