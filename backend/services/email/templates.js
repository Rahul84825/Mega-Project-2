const currencyFormatter = (currency) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2
  });

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatMoney = (amount, currency) => currencyFormatter(currency).format(Number(amount || 0));

const formatAddress = (address = {}) => {
  const parts = [
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean);
  return parts.map((part) => escapeHtml(part)).join(", ");
};

const buildItemRows = (items = [], currency) =>
  items
    .map((item) => {
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0eae1;">
            <div style="font-weight: 600; color: #2b1b10;">${escapeHtml(item.titleSnapshot)}</div>
            <div style="color: #7a5b44; font-size: 12px;">${escapeHtml(item.selectedVariant?.label || "")}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0eae1; text-align: center;">${escapeHtml(item.quantity)}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f0eae1; text-align: right;">${formatMoney(item.finalAmount, currency)}</td>
        </tr>
      `;
    })
    .join("");

const buildPricingRows = (totals = {}, currency) => {
  const rows = [
    { label: "Items Subtotal", value: totals.itemsSubtotal },
    { label: "GST", value: totals.gstTotal },
    { label: "Shipping", value: totals.shippingFee }
  ];

  if (Number(totals.discountTotal || 0) > 0) {
    rows.push({ label: "Discount", value: -Math.abs(totals.discountTotal || 0) });
  }

  if (Number(totals.roundingAdjustment || 0) !== 0) {
    rows.push({ label: "Rounding", value: totals.roundingAdjustment });
  }

  rows.push({ label: "Grand Total", value: totals.grandTotal, strong: true });

  return rows
    .map((row) => {
      const value = row.value || 0;
      return `
        <tr>
          <td style="padding: 6px 0; color: #6b4d38;">${escapeHtml(row.label)}</td>
          <td style="padding: 6px 0; text-align: right; font-weight: ${row.strong ? "700" : "500"}; color: #2b1b10;">${formatMoney(value, currency)}</td>
        </tr>
      `;
    })
    .join("");
};

export const buildOrderEmailHtml = ({
  order,
  title,
  subtitle,
  statusLabel,
  etaMinutes,
  rejectionReason
}) => {
  const currency = order?.totals?.currency || "INR";
  const items = Array.isArray(order?.items) ? order.items : [];
  const totals = order?.totals || {};
  const address = order?.shippingAddress || {};
  const customer = order?.customer || {};
  const estimatedTime = Number.isFinite(Number(etaMinutes))
    ? `${Number(etaMinutes)} mins`
    : order?.preparation?.etaMinutes
      ? `${Number(order.preparation.etaMinutes)} mins`
      : "To be confirmed";

  const rejectionSection = rejectionReason ? `
            <tr>
              <td style="padding: 16px 32px; background: #fef3f0; border-left: 3px solid #f97316;">
                <h3 style="margin: 0 0 6px; color: #c2410c;">Reason</h3>
                <p style="margin: 0; font-size: 14px; color: #7c2d12;">${escapeHtml(rejectionReason)}</p>
              </td>
            </tr>
  ` : "";

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #fbf6ef; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fbf6ef; padding: 32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 14px 40px rgba(61, 36, 18, 0.12);">
            <tr>
              <td style="padding: 28px 32px; background: linear-gradient(135deg, #f0c27b, #f89c6b); color: #2b1b10;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Mithai World</div>
                <h1 style="margin: 12px 0 6px; font-size: 26px;">${escapeHtml(title)}</h1>
                <p style="margin: 0; font-size: 14px;">${escapeHtml(subtitle)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 14px; color: #6b4d38;">Order ID</td>
                    <td style="font-size: 14px; color: #2b1b10; text-align: right; font-weight: 600;">${escapeHtml(order?.orderNumber || order?._id || "")}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #6b4d38; padding-top: 6px;">Status</td>
                    <td style="font-size: 14px; color: #2b1b10; text-align: right; font-weight: 600;">${escapeHtml(statusLabel)}</td>
                  </tr>
                  ${statusLabel !== "REJECTED" ? `<tr>
                    <td style="font-size: 14px; color: #6b4d38; padding-top: 6px;">Estimated prep time</td>
                    <td style="font-size: 14px; color: #2b1b10; text-align: right; font-weight: 600;">${escapeHtml(estimatedTime)}</td>
                  </tr>` : ""}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px;">
                <h3 style="margin: 18px 0 8px; color: #2b1b10;">Order Summary</h3>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <thead>
                    <tr>
                      <th align="left" style="border-bottom: 1px solid #f0eae1; padding-bottom: 8px; color: #7a5b44; font-size: 12px;">Item</th>
                      <th align="center" style="border-bottom: 1px solid #f0eae1; padding-bottom: 8px; color: #7a5b44; font-size: 12px;">Qty</th>
                      <th align="right" style="border-bottom: 1px solid #f0eae1; padding-bottom: 8px; color: #7a5b44; font-size: 12px;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildItemRows(items, currency)}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  ${buildPricingRows(totals, currency)}
                </table>
              </td>
            </tr>
            ${rejectionSection}
            <tr>
              <td style="padding: 0 32px 24px;">
                <h3 style="margin: 0 0 8px; color: #2b1b10;">Delivery Address</h3>
                <div style="font-size: 14px; color: #6b4d38; line-height: 1.6;">
                  <strong>${escapeHtml(customer.name || "Valued Customer")}</strong><br />
                  ${escapeHtml(customer.phone || "")}${customer.email ? ` • ${escapeHtml(customer.email)}` : ""}<br />
                  ${formatAddress(address)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; background: #fff7ee; font-size: 12px; color: #8c6a50;">
                Need help? Reply to this email or call our support team for quick assistance.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

export const buildOrderEmailText = ({ order, statusLabel, etaMinutes, rejectionReason }) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  const totals = order?.totals || {};
  const currency = totals.currency || "INR";
  const estimatedTime = Number.isFinite(Number(etaMinutes))
    ? `${Number(etaMinutes)} mins`
    : order?.preparation?.etaMinutes
      ? `${Number(order.preparation.etaMinutes)} mins`
      : "To be confirmed";

  const itemLines = items
    .map((item) => `- ${item.titleSnapshot} x${item.quantity} (${formatMoney(item.finalAmount, currency)})`)
    .join("\n");

  const rejectionText = rejectionReason ? `\nReason for rejection: ${rejectionReason}\n` : "";

  return `Order ${order?.orderNumber || order?._id || ""}\nStatus: ${statusLabel}${statusLabel !== "REJECTED" ? `\nEstimated prep time: ${estimatedTime}` : ""}${rejectionText}\n\nItems:\n${itemLines}\n\nItems Subtotal: ${formatMoney(totals.itemsSubtotal, currency)}\nGST: ${formatMoney(totals.gstTotal, currency)}\nShipping: ${formatMoney(totals.shippingFee, currency)}\nDiscount: ${formatMoney(totals.discountTotal || 0, currency)}\nGrand Total: ${formatMoney(totals.grandTotal, currency)}\n`;
};
