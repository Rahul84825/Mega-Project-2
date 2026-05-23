# Shiprocket Integration Guide 🚚

To move from a **Mock** system to **Shiprocket**, you need to connect your backend to their API and set up Webhooks for automatic status updates.

## 1. The Delivery Lifecycle (Production)

1.  **Order Placed:** Customer places an order on your site.
2.  **Admin Accepts:** Admin accepts the order and sets an ETA.
3.  **Create Shipment (Backend):** 
    *   Your backend calls Shiprocket's `/external/orders/create/adhoc` API.
    *   Shiprocket returns a `shipment_id` and `awb_code`.
    *   Your backend saves these to the Order database.
4.  **Rider Assigned:** Shiprocket assigns a rider.
5.  **Pickup:** Rider arrives and picks up the order (Admin/Kitchen provides the OTP if required).
6.  **In Transit:** Rider is on the way.
7.  **Delivered:** Rider marks it as delivered in the **Shiprocket Rider App**.
8.  **Webhook Trigger:** Shiprocket sends a `POST` request to your backend URL (e.g., `mithaiworld.com/api/webhooks/shiprocket`).
9.  **Auto-Update:** Your backend receives the "Delivered" status and updates the database. **Admin sees the status change instantly via Socket.io.**

---

## 2. Technical Implementation Steps

### A. Authentication
You must first get an API Token from Shiprocket.
```javascript
// Example: Get Token
const response = await axios.post('https://apiv2.shiprocket.in/v2/authenticated/auth/login', {
  email: 'your_email',
  password: 'your_password'
});
const token = response.data.token;
```

### B. Creating the Order
In `backend/services/deliveryService.js`, replace the mock logic with:
```javascript
export const assignDeliveryPartner = async (orderId) => {
  // 1. Fetch order from DB
  // 2. Format data for Shiprocket (address, items, weight)
  // 3. API Call: axios.post('.../external/orders/create/adhoc', payload, { headers: { Authorization: `Bearer ${token}` } })
  // 4. Update order with Shiprocket's 'shipment_id' and 'awb_code'
};
```

### C. The Webhook (Crucial for "How do I know?")
This is how your server "knows" the order is delivered without you checking.

1.  **Configure in Shiprocket Panel:** Go to Settings -> API -> Webhooks.
2.  **Set URL:** `https://your-api.com/api/webhooks/shiprocket`
3.  **Select Events:** "Order Delivered", "Order Picked Up".
4.  **Backend Route:**
```javascript
// backend/routes/webhookRoutes.js
router.post('/shiprocket', (req, res) => {
  const { awb, status } = req.body;
  if (status === 'delivered') {
    // Find order by AWB and update status to DELIVERED in database
    // Trigger socket.io to update Admin screen
  }
  res.status(200).send('OK');
});
```

## 3. How will you know?
*   **Admin Dashboard:** The order card will automatically move from the "Ready" tab to the "Delivered" tab.
*   **Customer Email:** The system will automatically send the "Your order has been delivered" email to the customer.
*   **Notifications:** You can set up your backend to send you a WhatsApp/SMS alert when the webhook hits.

## 4. Why Shiprocket?
*   **Rider Management:** They handle the riders (Shadowfax, Dunzo, etc.).
*   **Tracking:** You get a tracking link to show the customer.
*   **Insurance:** Orders are protected.

---
**Next Step:** Once you have your Shiprocket API credentials (email/password), we can write the actual integration code in `deliveryService.js`.
