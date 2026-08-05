import React from "react";
import "./print.css";

/**
 * Format Currency Helper for Thermal Print (₹)
 */
const formatThermalCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toFixed(2)}`;
};

/**
 * KitchenReceipt - Premium Zomato-Style Thermal KOT Component
 */
const KitchenReceipt = ({ order, printTimestamp }) => {
  if (!order) return null;

  // Resolve Order Numbers & Metadata
  const displayOrderNum = order.orderNumber || order.orderId || (order._id ? `#${order._id.slice(-6).toUpperCase()}` : "#MW-0000");
  
  // Date & Time
  const orderDateObj = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const formattedTime = orderDateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // Timestamps (Bonus)
  const printTimeStr = printTimestamp
    ? new Date(printTimestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const acceptedTimeStr = order.statusTimestamps?.acceptedAt
    ? new Date(order.statusTimestamps.acceptedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : null;

  const preparingTimeStr = order.statusTimestamps?.preparingAt
    ? new Date(order.statusTimestamps.preparingAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : null;

  // Order Status & Payment Info
  const orderStatus = (order.status || "PLACED").toUpperCase();
  
  const paymentMethod = (
    order.payment?.method ||
    order.paymentMethod ||
    "ONLINE"
  ).toUpperCase();

  const paymentStatus = (
    order.payment?.status ||
    order.paymentStatus ||
    "PAID"
  ).toUpperCase();

  // Address & Customer Info
  const customerName = order.customer?.name || "Guest Customer";
  const customerPhone = order.customer?.phone || "N/A";
  const address = order.shippingAddress || {};
  
  const fullAddressStr = [
    address.flatNo || address.buildingName,
    address.line1,
    address.line2,
    address.area,
    address.city || "Pune",
    address.postalCode || address.pincode
  ].filter(Boolean).join(", ");

  const landmark = address.landmark || "";

  // Order Type (Delivery or Pickup)
  const isPickup = String(order.orderType || "").toLowerCase() === "pickup" || String(address.line1 || "").toLowerCase().includes("pickup");
  const orderTypeStr = isPickup ? "PICKUP" : "DELIVERY";

  // Delivery OTP (if available)
  const otpCode = 
    order.deliveryOtp?.code ||
    (typeof order.deliveryOtp === "string" ? order.deliveryOtp : null) ||
    order.delivery?.pickupOtp ||
    order.pickupOtp ||
    order.otp ||
    null;

  // Items
  const items = Array.isArray(order.items) ? order.items : [];

  // Totals (strictly from stored order, no recalculation)
  const totals = order.totals || {};
  const itemsSubtotal = totals.itemsSubtotal ?? order.subtotal ?? 0;
  const gstTotal = totals.gstTotal ?? order.gstTotal ?? 0;
  const packingTotal = totals.packingTotal ?? order.packingTotal ?? order.packingFee ?? 0;
  const shippingFee = totals.shippingFee ?? order.deliveryFee ?? order.shippingFee ?? 0;
  const discountTotal = totals.discountTotal ?? totals.couponDiscount ?? order.discount ?? 0;
  const grandTotal = totals.grandTotal ?? order.total ?? order.grandTotal ?? 0;

  // Coupon
  const couponCode = order.coupon?.code || order.couponCode || null;

  // Special Notes
  const customerNotes = order.notes || order.customerNotes || order.specialInstructions || "";

  // Logistics / Rider info if assigned
  const riderName = order.rider?.name || null;
  const riderPhone = order.rider?.phone || null;
  const deliveryProvider = order.delivery?.provider || null;

  return (
    <div className="kitchen-receipt-container">
      {/* ── HEADER ── */}
      <div className="thermal-center">
        <div className="thermal-store-name">MITHAI WORLD</div>
        <div className="thermal-bold thermal-small" style={{ marginTop: "2px" }}>Premium Sweets & Snacks</div>
        <div className="thermal-small">Viman Nagar, Pune</div>
        <div className="thermal-small">Phone: +91 98581 06106</div>
        <div className="thermal-small">FSSAI Lic. No. 11520034000065</div>
      </div>

      <hr className="thermal-divider-solid" />

      {/* ── ORDER META ── */}
      <div className="thermal-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="thermal-meta-label">Order No:</span>
          <span className="thermal-bold" style={{ fontSize: "14px" }}>#{displayOrderNum}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
          <span>Date: {formattedDate}</span>
          <span>Time: {formattedTime}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
          <span>Platform: <strong>Website Order</strong></span>
          <span>Type: <strong>{orderTypeStr}</strong></span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
          <span>Payment: <strong>{paymentMethod}</strong></span>
          <span>Status: <strong>{paymentStatus}</strong></span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
          <span>Order Status: <strong>{orderStatus}</strong></span>
          <span>Print: {printTimeStr}</span>
        </div>

        {(acceptedTimeStr || preparingTimeStr) && (
          <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
            {acceptedTimeStr && <span>Accepted: {acceptedTimeStr}</span>}
            {preparingTimeStr && <span>Kitchen: {preparingTimeStr}</span>}
          </div>
        )}
      </div>

      <hr className="thermal-divider" />

      {/* ── CUSTOMER DETAILS ── */}
      <div className="thermal-section">
        <div className="thermal-meta-label">CUSTOMER DETAILS</div>
        <div className="thermal-customer-name" style={{ marginTop: "2px" }}>
          {customerName}
        </div>
        <div className="thermal-small">
          <strong>Phone:</strong> {customerPhone}
        </div>
        {fullAddressStr && (
          <div className="thermal-small" style={{ marginTop: "2px", wordBreak: "break-word" }}>
            <strong>Address:</strong> {fullAddressStr}
          </div>
        )}
        {landmark && (
          <div className="thermal-small">
            <strong>Landmark:</strong> {landmark}
          </div>
        )}

        {/* ── DELIVERY OTP (LARGE & BOLD IF PRESENT) ── */}
        {otpCode && (
          <div 
            style={{ 
              marginTop: "6px", 
              padding: "4px 8px", 
              border: "1px solid #000", 
              textAlign: "center",
              backgroundColor: "#ffffff"
            }}
          >
            <span className="thermal-meta-label" style={{ display: "block" }}>DELIVERY OTP</span>
            <span className="thermal-otp">{otpCode}</span>
          </div>
        )}
      </div>

      <hr className="thermal-divider-solid" />

      {/* ── SUMMARY TITLE ── */}
      <div className="thermal-center thermal-bold" style={{ fontSize: "13px", letterSpacing: "1px", margin: "4px 0" }}>
        --- SUMMARY ---
      </div>

      <hr className="thermal-divider" />

      {/* ── ITEMS TABLE ── */}
      <div className="thermal-section">
        {items.length === 0 ? (
          <div className="thermal-center thermal-small">No items in order</div>
        ) : (
          items.map((item, idx) => {
            const title = item.titleSnapshot || item.name || item.title || "Sweet Item";
            const variant = item.selectedVariant?.label || item.variantLabel || item.variant || null;
            const qty = item.quantity || 1;
            const unitPrice = item.sellingPriceAtPurchase || (item.subtotal ? (item.subtotal / qty) : 0);
            const lineTotal = item.finalAmount || item.subtotal || (unitPrice * qty);
            const itemNote = item.notes || item.customization || item.instructions || null;
            const comboProducts = Array.isArray(item.comboItems) ? item.comboItems : [];

            return (
              <div key={idx} className="thermal-item-row" style={{ marginBottom: "6px" }}>
                {/* Item Name */}
                <div className="thermal-product-name">{title}</div>

                {/* Variant */}
                {variant && (
                  <div className="thermal-small" style={{ paddingLeft: "4px" }}>
                    Variant: {variant}
                  </div>
                )}

                {/* Qty x Price & Line Total Row */}
                <div style={{ display: "flex", justifyBetween: "space-between", justifyContent: "space-between", marginTop: "2px" }}>
                  <span className="thermal-small">
                    {qty} × {formatThermalCurrency(unitPrice)}
                  </span>
                  <span className="thermal-bold thermal-small">
                    {formatThermalCurrency(lineTotal)}
                  </span>
                </div>

                {/* Item Notes / Customizations */}
                {itemNote && (
                  <div className="thermal-small" style={{ fontStyle: "italic", paddingLeft: "6px" }}>
                    Note: {itemNote}
                  </div>
                )}

                {/* Combo Items breakdown if present */}
                {comboProducts.length > 0 && (
                  <div style={{ paddingLeft: "8px" }} className="thermal-small">
                    <div style={{ fontWeight: "bold" }}>Includes:</div>
                    {comboProducts.map((c, cIdx) => (
                      <div key={cIdx}>• {c.name || c.title} {c.quantity ? `(${c.quantity})` : ""}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <hr className="thermal-divider" />

      {/* ── ORDER TOTALS ── */}
      <div className="thermal-section thermal-avoid-break">
        <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
          <span>Items Subtotal:</span>
          <span>{formatThermalCurrency(itemsSubtotal)}</span>
        </div>

        {packingTotal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
            <span>Packing Charges:</span>
            <span>{formatThermalCurrency(packingTotal)}</span>
          </div>
        )}

        {gstTotal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
            <span>GST:</span>
            <span>{formatThermalCurrency(gstTotal)}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
          <span>Delivery Charges:</span>
          <span>{shippingFee > 0 ? formatThermalCurrency(shippingFee) : "FREE"}</span>
        </div>

        {discountTotal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }} className="thermal-small">
            <span>Coupon Discount {couponCode ? `(${couponCode})` : ""}:</span>
            <span>-{formatThermalCurrency(discountTotal)}</span>
          </div>
        )}

        <hr className="thermal-divider-solid" />

        {/* Grand Total (Second Largest Text) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="thermal-grand-total">GRAND TOTAL:</span>
          <span className="thermal-grand-total">{formatThermalCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* ── SPECIAL INSTRUCTIONS (IF PRESENT) ── */}
      {customerNotes && (
        <>
          <hr className="thermal-divider" />
          <div className="thermal-section thermal-avoid-break">
            <div className="thermal-meta-label">SPECIAL INSTRUCTIONS</div>
            <div className="thermal-small thermal-bold" style={{ marginTop: "2px", whiteSpace: "pre-wrap" }}>
              {customerNotes}
            </div>
          </div>
        </>
      )}

      {/* ── RIDER / LOGISTICS INFO (IF ASSIGNED) ── */}
      {(riderName || deliveryProvider) && (
        <>
          <hr className="thermal-divider" />
          <div className="thermal-section thermal-small">
            <div className="thermal-meta-label">DELIVERY PARTNER</div>
            <div>Provider: {deliveryProvider || "Borzo"}</div>
            {riderName && <div>Rider: <strong>{riderName}</strong></div>}
            {riderPhone && <div>Phone: {riderPhone}</div>}
          </div>
        </>
      )}

      <hr className="thermal-divider-double" />

      {/* ── FOOTER ── */}
      <div className="thermal-center thermal-small thermal-avoid-break">
        <div className="thermal-bold">This is an Internal Kitchen Order Ticket</div>
        <div>Not a Tax Invoice</div>
        <div className="thermal-bold" style={{ marginTop: "4px" }}>Mithai World</div>
        <div style={{ marginTop: "2px" }}>Thank You!</div>
      </div>
    </div>
  );
};

export default KitchenReceipt;
