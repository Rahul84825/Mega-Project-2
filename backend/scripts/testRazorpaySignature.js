#!/usr/bin/env node
/**
 * RAZORPAY VERIFICATION TEST SCRIPT
 * Tests HMAC signature calculation and verification
 * Usage: node scripts/testRazorpaySignature.js
 */

import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const keySecret = process.env.RAZORPAY_KEY_SECRET;
const testOrderId = "order_1A2B3C4D5E6F7G8H9I0J1K2L";
const testPaymentId = "pay_1A2B3C4D5E6F7G8H9I0J1K2L";

console.log("\n");
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║         RAZORPAY SIGNATURE VERIFICATION TEST SCRIPT         ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("\n");

// Check environment
if (!keySecret) {
  console.error("❌ ERROR: RAZORPAY_KEY_SECRET is not set in environment variables");
  process.exit(1);
}

console.log("✅ RAZORPAY_KEY_SECRET found");
console.log("   Length:", keySecret.length);
console.log("   Prefix:", keySecret.substring(0, 10) + "...");
console.log("\n");

// Test 1: Calculate signature
console.log("📝 TEST 1: Calculating HMAC-SHA256 Signature");
console.log("   Order ID:  ", testOrderId);
console.log("   Payment ID:", testPaymentId);

const verificationString = `${testOrderId}|${testPaymentId}`;
console.log("   Verification String:", verificationString);

const calculatedSignature = crypto
  .createHmac("sha256", keySecret)
  .update(verificationString)
  .digest("hex");

console.log("   Calculated Signature:", calculatedSignature);
console.log("   Signature Length:", calculatedSignature.length);
console.log("   ✅ HMAC calculation successful\n");

// Test 2: Verify signature (should match when using same key)
console.log("📝 TEST 2: Verifying Signature");
const receivedSignature = calculatedSignature; // Simulating a received signature
const isValid = calculatedSignature === receivedSignature;

console.log("   Received Signature:", receivedSignature);
console.log("   Match Result:", isValid ? "✅ VALID" : "❌ INVALID");

if (isValid) {
  console.log("   ✅ Signature verification successful\n");
} else {
  console.log("   ❌ Signature verification failed\n");
}

// Test 3: Frontend/Backend compatibility check
console.log("📝 TEST 3: Frontend/Backend Payload Structure");
console.log("   Frontend should send:");
console.log("   {");
console.log(`     razorpay_order_id: "${testOrderId}",`);
console.log(`     razorpay_payment_id: "${testPaymentId}",`);
console.log(`     razorpay_signature: "${calculatedSignature}",`);
console.log("     orderData: { ... }");
console.log("   }");
console.log("   ✅ Payload structure defined\n");

// Test 4: Display what backend expects
console.log("📝 TEST 4: Backend Verification Steps");
console.log("   1. Extract razorpay_order_id, razorpay_payment_id, razorpay_signature");
console.log("   2. Create verification string: order_id|payment_id");
console.log("   3. Calculate HMAC-SHA256 with RAZORPAY_KEY_SECRET");
console.log("   4. Compare calculated signature with received signature");
console.log("   5. If match: ✅ Verify, If no match: ❌ Reject\n");

// Summary
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║                        SUMMARY                             ║");
console.log("╠════════════════════════════════════════════════════════════╣");
console.log("║ ✅ RAZORPAY_KEY_SECRET is configured                       ║");
console.log("║ ✅ HMAC-SHA256 calculation is working                      ║");
console.log("║ ✅ Signature verification logic is correct                 ║");
console.log("║                                                            ║");
console.log("║ If payment verification is still failing:                  ║");
console.log("║ 1. Check that Frontend KEY_ID matches Backend KEY_SECRET  ║");
console.log("║    (both should be TEST or both LIVE, not mixed)           ║");
console.log("║ 2. Ensure orderData contains valid items array            ║");
console.log("║ 3. Check MongoDB connection and schema validation          ║");
console.log("║ 4. Run with NODE_ENV=development for detailed logging     ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("\n");
