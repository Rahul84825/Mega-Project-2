import { getResendClient } from "./resendClient.js";
import { buildOrderEmailHtml, buildOrderEmailText } from "./templates.js";

const getFromAddress = () => {
  const from = String(process.env.RESEND_FROM || "").trim();
  if (!from) {
    throw new Error("RESEND_FROM is not configured");
  }
  return from;
};

const getReplyTo = () => String(process.env.RESEND_REPLY_TO || "").trim();

const sendEmail = async ({ to, subject, html, text }) => {
  const resend = getResendClient();
  const payload = {
    from: getFromAddress(),
    to,
    subject,
    html,
    text
  };

  const replyTo = getReplyTo();
  if (replyTo) {
    payload.reply_to = replyTo;
  }

  return resend.emails.send(payload);
};

export const sendOrderConfirmationEmail = async ({ order, to, etaMinutes }) => {
  const subject = `Order confirmed - ${order?.orderNumber || "Mithai World"}`;
  const html = buildOrderEmailHtml({
    order,
    title: "Order confirmed",
    subtitle: "We are preparing your mithai with care.",
    statusLabel: "PLACED",
    etaMinutes
  });
  const text = buildOrderEmailText({ order, statusLabel: "PLACED", etaMinutes });
  return sendEmail({ to, subject, html, text });
};

export const sendOrderAcceptedEmail = async ({ order, to, etaMinutes }) => {
  const subject = `Order accepted - ${order?.orderNumber || "Mithai World"}`;
  const html = buildOrderEmailHtml({
    order,
    title: "Order accepted",
    subtitle: "Our chefs have started working on your order.",
    statusLabel: "ACCEPTED",
    etaMinutes
  });
  const text = buildOrderEmailText({ order, statusLabel: "ACCEPTED", etaMinutes });
  return sendEmail({ to, subject, html, text });
};

export const sendOrderRejectedEmail = async ({ order, to, rejectionReason }) => {
  const subject = `Order update - ${order?.orderNumber || "Mithai World"}`;
  const html = buildOrderEmailHtml({
    order,
    title: "Order could not be accepted",
    subtitle: "We are sorry, but we could not accept this order.",
    statusLabel: "REJECTED",
    rejectionReason: rejectionReason || order?.rejectionReason || ""
  });
  const text = buildOrderEmailText({ 
    order, 
    statusLabel: "REJECTED", 
    rejectionReason: rejectionReason || order?.rejectionReason || ""
  });
  return sendEmail({ to, subject, html, text });
};

export const sendOrderReadyEmail = async ({ order, to, etaMinutes }) => {
  const subject = `Order ready for pickup - ${order?.orderNumber || "Mithai World"}`;
  const html = buildOrderEmailHtml({
    order,
    title: "Order ready",
    subtitle: "Your order is ready and will be handed over soon.",
    statusLabel: "READY_FOR_PICKUP",
    etaMinutes
  });
  const text = buildOrderEmailText({ order, statusLabel: "READY_FOR_PICKUP", etaMinutes });
  return sendEmail({ to, subject, html, text });
};

export const sendOrderPickedUpEmail = async ({ order, to, etaMinutes }) => {
  const subject = `Order picked up - ${order?.orderNumber || "Mithai World"}`;
  const html = buildOrderEmailHtml({
    order,
    title: "Order picked up",
    subtitle: "Your order is on the way.",
    statusLabel: "PICKED_UP",
    etaMinutes
  });
  const text = buildOrderEmailText({ order, statusLabel: "PICKED_UP", etaMinutes });
  return sendEmail({ to, subject, html, text });
};

export const sendOrderDeliveredEmail = async ({ order, to }) => {
  const subject = `Order delivered - ${order?.orderNumber || "Mithai World"}`;
  const html = buildOrderEmailHtml({
    order,
    title: "Order delivered",
    subtitle: "We hope you enjoy your mithai.",
    statusLabel: "DELIVERED"
  });
  const text = buildOrderEmailText({ order, statusLabel: "DELIVERED" });
  return sendEmail({ to, subject, html, text });
};
