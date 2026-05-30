import axios from "axios";

// Target running backend
const BACKEND_URL = "http://localhost:5000";
const WEBHOOK_ENDPOINT = `${BACKEND_URL}/api/delivery/webhook/borzo`;
const CALLBACK_TOKEN = "96E7A948233D35E27F6471360948751A605FBBC3";
const TASK_ID = "326389";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const payloads = [
  {
    stage: "1. searching_courier",
    body: {
      order_id: TASK_ID,
      status: "searching_courier",
      client_order_id: "ORD-RZP-MPR6H755"
    }
  },
  {
    stage: "2. courier_assigned",
    body: {
      order_id: TASK_ID,
      status: "courier_assigned",
      client_order_id: "ORD-RZP-MPR6H755",
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
      order_id: TASK_ID,
      status: "delivering",
      client_order_id: "ORD-RZP-MPR6H755",
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
      order_id: TASK_ID,
      status: "completed",
      client_order_id: "ORD-RZP-MPR6H755",
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
  console.log(`🚀 STARTING REAL HTTP WEBHOOK LIFECYCLE FOR TASK: ${TASK_ID}`);
  console.log("=========================================");

  for (const item of payloads) {
    console.log(`\n\n>>> Sending Webhook for Stage: ${item.stage} <<<`);
    try {
      const response = await axios.post(WEBHOOK_ENDPOINT, item.body, {
        headers: {
          "Content-Type": "application/json",
          "x-dv-auth-token": CALLBACK_TOKEN
        }
      });
      console.log(`🟢 [HTTP ${response.status}] Webhook successfully received by backend!`);
    } catch (error) {
      console.error(`❌ Webhook delivery failed:`, error.response?.data || error.message);
    }
    await sleep(2500); // Wait between transitions
  }

  console.log("\n=========================================");
  console.log("🏁 LIFECYCLE COMPLETED");
  console.log("=========================================");
};

run();
