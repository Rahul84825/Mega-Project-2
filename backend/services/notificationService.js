import admin from "firebase-admin";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";

let fcmInitialized = false;

try {
  const serviceAccountPath = path.resolve("firebase-service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    fcmInitialized = true;
    logger.info("🔥 Firebase Admin SDK initialized successfully");
  } else {
    logger.warn("⚠️ Firebase service account file not found at firebase-service-account.json. FCM Push Notifications will be mocked.");
  }
} catch (error) {
  logger.error("❌ Failed to initialize Firebase Admin SDK", error);
}

const cleanupInvalidTokens = async (responses, tokens) => {
  try {
    const invalidTokens = [];
    responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (error && (error.code === "messaging/invalid-registration-token" || error.code === "messaging/registration-token-not-registered")) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      logger.info(`[FCM] Cleaning up ${invalidTokens.length} expired or invalid FCM tokens...`);
      await User.updateMany(
        { fcmTokens: { $in: invalidTokens } },
        { $pull: { fcmTokens: { $in: invalidTokens } } }
      );
    }
  } catch (err) {
    logger.error("[FCM] Error cleaning up invalid tokens", err);
  }
};

export const sendNewOrderPushNotification = async (order) => {
  if (!fcmInitialized) {
    logger.warn(`[FCM MOCK] New Order Push Notification for order ${order.orderNumber}. (FCM not initialized)`);
    return;
  }

  try {
    const admins = await User.find({ isAdmin: true, fcmTokens: { $exists: true, $ne: [] } });
    const tokens = admins.reduce((acc, adminUser) => {
      if (Array.isArray(adminUser.fcmTokens)) {
        acc.push(...adminUser.fcmTokens);
      }
      return acc;
    }, []);

    if (tokens.length === 0) {
      logger.info(`[FCM] No admin FCM tokens registered. Skipping push notification.`);
      return;
    }

    const payload = {
      notification: {
        title: "🛒 New Order Received",
        body: `Order #${order.orderNumber}\n₹${order.totals?.grandTotal || order.amount}\nCustomer: ${order.customer?.name || "Guest"}`
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        orderId: String(order._id),
        orderNumber: String(order.orderNumber),
        type: "new_order"
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    logger.info(`[FCM] New Order Push Notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(response.responses, tokens);
    }
  } catch (error) {
    logger.error("❌ [FCM] Failed to send new order push notification", error);
  }
};

export const sendNewOrderReminderPushNotification = async (order) => {
  if (!fcmInitialized) {
    logger.warn(`[FCM MOCK] Reminder Push Notification for order ${order.orderNumber}. (FCM not initialized)`);
    return;
  }

  try {
    const admins = await User.find({ isAdmin: true, fcmTokens: { $exists: true, $ne: [] } });
    const tokens = admins.reduce((acc, adminUser) => {
      if (Array.isArray(adminUser.fcmTokens)) {
        acc.push(...adminUser.fcmTokens);
      }
      return acc;
    }, []);

    if (tokens.length === 0) return;

    const payload = {
      notification: {
        title: "⚠️ Order Still Pending!",
        body: `Order #${order.orderNumber} (₹${order.totals?.grandTotal}) is waiting for acceptance.`
      },
      data: {
        orderId: String(order._id),
        orderNumber: String(order.orderNumber),
        type: "order_reminder"
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    logger.info(`[FCM] Reminder Push Notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(response.responses, tokens);
    }
  } catch (error) {
    logger.error("❌ [FCM] Failed to send reminder push notification", error);
  }
};

export const startReminderScheduler = () => {
  logger.info("⏱️ FCM Order Reminder Scheduler started.");
  setInterval(async () => {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      
      const pendingOrders = await Order.find({
        status: "PLACED",
        createdAt: { $lte: twoMinutesAgo }
      });

      for (const order of pendingOrders) {
        const lastSent = order.metadata?.lastReminderSentAt ? new Date(order.metadata.lastReminderSentAt) : null;
        const twoMinutesSinceLastSent = lastSent ? (Date.now() - lastSent.getTime() >= 2 * 60 * 1000) : true;

        if (!lastSent || twoMinutesSinceLastSent) {
          logger.info(`[Reminder Scheduler] Triggering reminder push for order: ${order.orderNumber}`);
          await sendNewOrderReminderPushNotification(order);
          
          if (!order.metadata) {
            order.metadata = {};
          }
          order.metadata.lastReminderSentAt = new Date();
          order.markModified("metadata");
          await order.save();
        }
      }
    } catch (err) {
      logger.error("❌ Error in FCM reminder scheduler:", err);
    }
  }, 30 * 1000);
};
