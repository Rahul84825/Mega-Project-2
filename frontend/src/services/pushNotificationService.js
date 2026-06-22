import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import api from "./api";

let currentFcmToken = null;

export const initPushNotifications = async (isAdmin) => {
  if (!Capacitor.isNativePlatform()) {
    console.log("FCM: Push notifications are disabled on web.");
    return;
  }

  if (!isAdmin) {
    console.log("FCM: Push notifications are only enabled for admin users.");
    return;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("FCM: Push notification permission denied.");
      return;
    }

    await PushNotifications.register();

    if (Capacitor.getPlatform() === "android") {
      await PushNotifications.createChannel({
        id: "NEW_ORDERS",
        name: "New Orders",
        description: "Notifications for incoming customer orders",
        importance: 5, // High importance
        sound: "notification", 
        visibility: 1, 
        vibration: true
      });
    }

    await PushNotifications.removeAllListeners();

    PushNotifications.addListener("registration", async (token) => {
      console.log("FCM Device Token registered:", token.value);
      currentFcmToken = token.value;
      
      try {
        await api.post("/api/auth/fcm-token", { fcmToken: token.value });
        console.log("FCM Device Token successfully registered on backend.");
      } catch (err) {
        console.error("FCM: Failed to register device token on backend:", err);
      }
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("FCM Registration Error:", error);
    });

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("FCM Push Notification received in foreground:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
      console.log("FCM Push Notification clicked:", notification);
      window.location.href = "/admin/orders";
    });

  } catch (error) {
    console.error("FCM: Error during push notification initialization:", error);
  }
};

export const unregisterPushNotifications = async () => {
  if (!Capacitor.isNativePlatform() || !currentFcmToken) {
    return;
  }

  try {
    console.log("FCM: Deregistering FCM token from backend:", currentFcmToken);
    await api.delete("/api/auth/fcm-token", { data: { fcmToken: currentFcmToken } });
    currentFcmToken = null;
    await PushNotifications.unregister();
  } catch (err) {
    console.error("FCM: Failed to deregister device token on logout:", err);
  }
};
