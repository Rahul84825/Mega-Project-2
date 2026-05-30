import axios from "axios";

// Target deployed Render backend
const BACKEND_URL = "https://mega-project-2-b880.onrender.com";
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/api/delivery/webhook/borzo`;
const CALLBACK_TOKEN = "96E7A948233D35E27F6471360948751A605FBBC3";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const orders = [
  { label: "Order A", taskId: "326404", clientOrderId: "ORD-RZP-MPRXI3DF" },
  { label: "Order B", taskId: "326389", clientOrderId: "ORD-RZP-MPR6H755" }
];

const getPayloads = (taskId, clientOrderId) => [
  {
    stage: "1. searching_courier",
    body: {
      order_id: taskId,
      status: "searching_courier",
      client_order_id: clientOrderId
    }
  },
  {
    stage: "2. courier_assigned",
    body: {
      order_id: taskId,
      status: "courier_assigned",
      client_order_id: clientOrderId,
      courier: {
        name: "Sunil Kumar",
        phone: "+919876543210",
        vehicle_number: "MH-12-PQ-5678"
      }
    }
  },
  {
    stage: "3. delivering (courier_departed)",
    body: {
      order_id: taskId,
      status: "delivering",
      client_order_id: clientOrderId,
      courier: {
        name: "Sunil Kumar",
        phone: "+919876543210",
        vehicle_number: "MH-12-PQ-5678"
      }
    }
  },
  {
    stage: "4. completed (delivered)",
    body: {
      order_id: taskId,
      status: "completed",
      client_order_id: clientOrderId,
      courier: {
        name: "Sunil Kumar",
        phone: "+919876543210",
        vehicle_number: "MH-12-PQ-5678"
      }
    }
  }
];

const run = async () => {
  console.log("\n=========================================");
  console.log(`🚀 STARTING LIVE PRODUCTION HTTP WEBHOOK LIFECYCLE FOR TWO CONSECUTIVE ORDERS`);
  console.log(`🔗 Target: ${WEBHOOK_ENDPOINT}`);
  console.log("=========================================");

  for (const order of orders) {
    console.log(`\n\n=========================================`);
    console.log(`🏁 PROCESSING ${order.label.toUpperCase()} (${order.clientOrderId})`);
    console.log(`=========================================`);

    const stages = getPayloads(order.taskId, order.clientOrderId);

    for (const item of stages) {
      console.log(`\n>>> Sending Webhook for Stage: ${item.stage} <<<`);
      try {
        const response = await axios.post(WEBHOOK_ENDPOINT, item.body, {
          headers: {
            "Content-Type": "application/json",
            "x-dv-auth-token": CALLBACK_TOKEN
          }
        });
        console.log(`🟢 [HTTP ${response.status}] Live Webhook successfully received by Render backend!`);
      } catch (error) {
        console.error(`❌ Live Webhook delivery failed:`, error.response?.data || error.message);
      }
      await sleep(1500); // Wait between transitions
    }
    
    await sleep(2000); // Wait between Order A and Order B
  }

  console.log("\n=========================================");
  console.log("🏁 TWO CONSECUTIVE ORDERS WEBHOOK SIMULATION COMPLETED");
  console.log("=========================================");
};

run();
