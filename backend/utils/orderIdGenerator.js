/**
 * Internal Order ID Generator
 * 
 * Generates unique, human-readable order IDs independent of Razorpay.
 * 
 * Format: MW-<timestamp>-<randomSuffix>
 * Example: MW-20260517-4832
 * 
 * Features:
 * - Never generates null or undefined
 * - Unique combination of timestamp and random values
 * - Human-readable for customer/admin reference
 * - Platform branding with "MW" prefix
 */

const generateOrderId = () => {
  // Use date YYYYMMDD format for readability
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  
  // Generate random 4-digit suffix for uniqueness
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Combine: MW-YYYYMMDD-RANDOMSUFFIX
  return `MW-${dateStr}-${randomSuffix}`;
};

export default generateOrderId;
