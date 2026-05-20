import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { buildOrderPlacedTemplate } from '../templates/orderPlacedTemplate.js';
import { buildOrderStatusTemplate } from '../templates/orderStatusTemplate.js';
import { buildPaymentTemplate } from '../templates/paymentTemplate.js';
import { buildAdminAlertTemplate } from '../templates/adminAlertTemplate.js';
import { buildAdminContactAlert, buildCustomerContactAck } from '../templates/contactTemplate.js';

let transporter = null;

/**
 * Initialize and get Nodemailer transporter
 */
const getTransporter = () => {
  if (!transporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      logger.warn("SMTP credentials not fully configured. Email service will run in MOCK mode.");
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: user || 'mock_user',
        pass: pass || 'mock_pass',
      },
    });

    // Verify connection configuration
    if (user && pass) {
      transporter.verify((error, success) => {
        if (error) {
          logger.error("❌ SMTP Connection Error", error);
        } else {
          logger.info("✅ SMTP Server is ready to take our messages");
        }
      });
    }
  }
  return transporter;
};

const getFromEmail = () => process.env.EMAIL_FROM || "Mithai World <orders@mithaiworld.com>";
const getAdminEmail = () => process.env.ADMIN_EMAIL || "admin@mithaiworld.com";

/**
 * Centralized safe email sending utility
 */
const sendEmailSafely = async (options) => {
  try {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      logger.info(`📧 [MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}`);
      return { messageId: "mock_id" };
    }

    const mailOptions = {
      from: getFromEmail(),
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await getTransporter().sendMail(mailOptions);
    
    logger.info(`📧 Email sent successfully`, { 
      messageId: info.messageId, 
      to: options.to, 
      subject: options.subject 
    });
    
    return info;
  } catch (error) {
    logger.error("❌ Email sending failed", { 
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    return null; // Non-blocking: continue even if email fails
  }
};

/**
 * CUSTOMER: Order Confirmation
 */
export const sendOrderPlacedEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildOrderPlacedTemplate(order, customer);
  await sendEmailSafely({
    to: customer.email,
    subject: `Order Confirmed! (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * ADMIN: New Order Alert
 */
export const sendAdminNewOrderAlert = async (order) => {
  const customer = order.customer || {};
  const html = buildAdminAlertTemplate(order, customer);
  
  await sendEmailSafely({
    to: getAdminEmail(),
    subject: `🚨 New Order Alert! (#${order.orderNumber}) - ₹${order.totals?.grandTotal}`,
    html
  });
};

/**
 * CUSTOMER: Order Accepted
 */
export const sendOrderAcceptedEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildOrderStatusTemplate(order, customer, "Order Accepted", "Our chefs have started working on your order.");
  await sendEmailSafely({
    to: customer.email,
    subject: `Order Accepted (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * CUSTOMER: Order Preparing
 */
export const sendOrderPreparingEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildOrderStatusTemplate(order, customer, "Order Preparing", "We are preparing your sweets.");
  await sendEmailSafely({
    to: customer.email,
    subject: `Order Preparing (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * CUSTOMER: Out for Delivery
 */
export const sendOrderOutForDeliveryEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildOrderStatusTemplate(order, customer, "Out for Delivery", "Your order is on the way!");
  await sendEmailSafely({
    to: customer.email,
    subject: `Order on the Way! (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * CUSTOMER: Order Delivered
 */
export const sendOrderDeliveredEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildOrderStatusTemplate(order, customer, "Order Delivered", "Order delivered successfully. Enjoy your sweets!");
  await sendEmailSafely({
    to: customer.email,
    subject: `Order Delivered (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * CUSTOMER: Order Rejected
 */
export const sendOrderRejectedEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildOrderStatusTemplate(order, customer, "Order Rejected", "Unfortunately, we had to cancel your order.");
  await sendEmailSafely({
    to: customer.email,
    subject: `Order Update (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * CUSTOMER: Payment Success
 */
export const sendPaymentSuccessEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildPaymentTemplate(order, customer, true);
  await sendEmailSafely({
    to: customer.email,
    subject: `Payment Successful (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * CUSTOMER: Payment Failure
 */
export const sendPaymentFailedEmail = async (order) => {
  const customer = order.customer || {};
  if (!customer.email) return;

  const html = buildPaymentTemplate(order, customer, false);
  await sendEmailSafely({
    to: customer.email,
    subject: `Payment Failed (#${order.orderNumber}) - Mithai World`,
    html
  });
};

/**
 * ADMIN: New Contact Form Submission Alert
 */
export const sendContactFormAdminAlert = async (inquiry) => {
  const html = buildAdminContactAlert(inquiry);
  await sendEmailSafely({
    to: getAdminEmail(),
    subject: `New Inquiry: ${inquiry.subject || 'Store Inquiry'} - from ${inquiry.name}`,
    html
  });
};

/**
 * CUSTOMER: Contact Form Acknowledgment
 */
export const sendContactFormCustomerReply = async (inquiry) => {
  if (!inquiry.email) return;
  const html = buildCustomerContactAck(inquiry);
  await sendEmailSafely({
    to: inquiry.email,
    subject: `We've received your message - Mithai World`,
    html
  });
};
