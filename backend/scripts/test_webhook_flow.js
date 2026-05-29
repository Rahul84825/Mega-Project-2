import dotenv from "dotenv";
dotenv.config();

import { createBorzoProvider } from "../services/delivery/providers/borzoProvider.js";

// Mock Order Document class
class MockOrder {
  constructor(data) {
    this.orderNumber = data.orderNumber || "ORD-RZP-MPP8ZYWG";
    this.status = data.status || "READY";
    this.delivery = data.delivery || {
      provider: "borzo",
      providerOrderId: "12345678",
      status: "DELIVERY_ASSIGNED",
      webhookHistory: []
    };
    this.rider = data.rider || {
      name: "",
      phone: "",
      vehicleNumber: ""
    };
  }

  toObject() {
    return {
      orderNumber: this.orderNumber,
      status: this.status,
      delivery: this.delivery,
      rider: this.rider
    };
  }

  async save() {
    return this;
  }
}

// ── RAW WEBHOOK PAYLOADS FROM BORZO (WEFAST) ──
const rawPayloads = [
  {
    stage: "1. SEARCHING_COURIER",
    headers: {
      "x-dv-auth-token": "96E7A948233D35E27F6471360948751A605FBBC3"
    },
    body: {
      "order_id": 12345678,
      "status": "searching_courier",
      "client_order_id": "ORD-RZP-MPP8ZYWG"
    }
  },
  {
    stage: "2. COURIER_ASSIGNED",
    headers: {
      "x-dv-auth-token": "96E7A948233D35E27F6471360948751A605FBBC3"
    },
    body: {
      "order_id": 12345678,
      "status": "courier_assigned",
      "client_order_id": "ORD-RZP-MPP8ZYWG",
      "courier": {
        "name": "Sunil Kumar",
        "phone": "+919876543210",
        "vehicle_number": "MH-12-PQ-5678"
      }
    }
  },
  {
    stage: "3. DELIVERING (COURIER DEPARTED / OUT FOR DELIVERY)",
    headers: {
      "x-dv-auth-token": "96E7A948233D35E27F6471360948751A605FBBC3"
    },
    body: {
      "order_id": 12345678,
      "status": "delivering",
      "client_order_id": "ORD-RZP-MPP8ZYWG",
      "courier": {
        "name": "Sunil Kumar",
        "phone": "+919876543210",
        "vehicle_number": "MH-12-PQ-5678"
      }
    }
  },
  {
    stage: "4. COMPLETED / DELIVERED",
    headers: {
      "x-dv-auth-token": "96E7A948233D35E27F6471360948751A605FBBC3"
    },
    body: {
      "order_id": 12345678,
      "status": "completed",
      "client_order_id": "ORD-RZP-MPP8ZYWG",
      "courier": {
        "name": "Sunil Kumar",
        "phone": "+919876543210",
        "vehicle_number": "MH-12-PQ-5678"
      }
    }
  }
];

const simulateWebhookLifecycle = async () => {
  const providerInstance = createBorzoProvider();
  
  // Shared order document across the lifecycle simulation
  const orderDoc = new MockOrder({
    orderNumber: "ORD-RZP-MPP8ZYWG",
    status: "READY",
    delivery: {
      provider: "borzo",
      providerOrderId: "12345678",
      status: "DELIVERY_ASSIGNED",
      webhookHistory: []
    }
  });

  console.log("\n=========================================");
  console.log("🎬 STARTING WEBHOOK LIFECYCLE SIMULATION");
  console.log("=========================================");

  for (const item of rawPayloads) {
    console.log(`\n\n>>> 🚀 STAGE: ${item.stage} <<<`);

    const req = {
      params: { provider: "borzo" },
      headers: item.headers,
      body: item.body
    };

    const provider = req.params.provider;
    const payload = req.body;

    // 1. RAW WEBHOOK ARRIVED & LOGGED
    console.log("=========================================");
    console.log("🚨 BORZO_WEBHOOK_HIT");
    console.log("📋 BORZO_WEBHOOK_HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("📦 BORZO_WEBHOOK_BODY:", JSON.stringify(payload, null, 2));
    console.log("=========================================");

    // 2. PARSE WEBHOOK
    const update = providerInstance.parseWebhook(payload);
    
    console.log("-----------------------------------------");
    console.log("PARSED_WEBHOOK", JSON.stringify(update, null, 2));
    console.log(`PARSED_TASK_ID: ${update?.taskId}`);
    console.log(`PARSED_STATUS: ${update?.status}`);
    console.log(`PARSED_EVENT: ${update?.event}`);
    console.log(`PARSED_RIDER:`, JSON.stringify(update?.rider, null, 2));
    console.log("-----------------------------------------");

    // 3. ORDER FOUND LOGIC
    console.log(`🔍 PROVIDER_ORDER_ID_LOOKUP: ${update.taskId}`);
    
    // Simulate Order.findOne lookup
    let order = null;
    if (orderDoc.delivery.providerOrderId === update.taskId) {
      order = orderDoc;
    }

    if (!order) {
      console.log(`⚠️ LOOKUP_SKIPPED: No order matches taskId ${update.taskId}`);
      continue;
    }

    console.log(`✅ ORDER_FOUND: ${order.orderNumber}`);

    // Track webhook history
    order.delivery.webhookHistory.push({
      event: update.event,
      receivedAt: new Date(),
      payload: payload
    });

    let statusChanged = false;

    // Sync rider metadata
    const oldRider = order.rider || {};
    const newRider = update.rider || {};
    if (newRider.name && (newRider.name !== oldRider.name || newRider.phone !== oldRider.phone)) {
      console.log(`👤 RIDER_FOUND_IN_WEBHOOK: ${newRider.name}`);
      order.rider = {
        name: newRider.name,
        phone: newRider.phone || oldRider.phone,
        vehicleNumber: newRider.vehicleNumber || oldRider.vehicleNumber
      };
      statusChanged = true;
    }

    // Map delivery events to internal order statuses with STRICT checks
    switch (update.event) {
      case "searching_courier":
        if (["RIDER_ASSIGNED", "PICKED_UP", "DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) break;
        if (order.delivery.status !== "SEARCHING_FOR_RIDER") {
          order.delivery.status = "SEARCHING_FOR_RIDER";
          statusChanged = true;
        }
        break;

      case "courier_assigned":
        if (["PICKED_UP", "DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) break;
        if (order.delivery.status !== "RIDER_ASSIGNED") {
          order.delivery.status = "RIDER_ASSIGNED";
          order.delivery.assignedAt = order.delivery.assignedAt || new Date();
          statusChanged = true;
        }
        break;

      case "picked_up":
        if (["DELIVERED", "DELIVERY_FAILED"].includes(order.delivery.status)) break;
        if (order.status !== "PICKED_UP" || order.delivery.status !== "PICKED_UP") {
          order.status = "PICKED_UP";
          order.delivery.status = "PICKED_UP";
          statusChanged = true;
        }
        break;

      case "delivered":
        if (order.delivery.status === "DELIVERY_FAILED") break;
        if (order.status !== "DELIVERED" || order.delivery.status !== "DELIVERED") {
          order.status = "DELIVERED";
          order.delivery.status = "DELIVERED";
          statusChanged = true;
        }
        break;

      case "canceled":
      case "failed_delivery":
        if (order.delivery.status !== "DELIVERY_FAILED" && order.delivery.status !== "DELIVERED") {
          order.delivery.status = "DELIVERY_FAILED";
          statusChanged = true;
        }
        break;
    }

    if (statusChanged) {
      console.log(`📝 ORDER_UPDATED: ${order.orderNumber} status changed to ${order.status}/${order.delivery.status}`);
    }

    // Save order
    await order.save();
    console.log(`💾 MONGODB_ORDER_STATUS: ${order.status}`);
    if (statusChanged && newRider.name) {
      console.log(`💾 RIDER_SAVED_TO_MONGODB: ${order.rider.name}`);
    }

    // Socket Emission
    if (statusChanged) {
      const socketPayload = order.toObject();
      console.log(`📡 SOCKET_PAYLOAD_STATUS: ${socketPayload.status}`);
      console.log(`📡 SOCKET_PAYLOAD_RIDER:`, JSON.stringify(socketPayload.rider, null, 2));
      console.log(`📡 SOCKET_EVENT_EMITTED: order:updated for Order: ${order.orderNumber}`);
    } else {
      console.log(`ℹ️ [WEBHOOK] No status change detected for Order: ${order.orderNumber}`);
    }
  }

  console.log("\n=========================================");
  console.log("🏁 LIFECYCLE SIMULATION COMPLETED");
  console.log("=========================================");
};

simulateWebhookLifecycle();
