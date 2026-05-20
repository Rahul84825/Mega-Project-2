import { logger } from "../utils/logger.js";
import { sendContactFormAdminAlert, sendContactFormCustomerReply } from "../services/emailService.js";

export const handleContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and message"
      });
    }

    const inquiry = { name, email, phone, subject, message };

    logger.info("📩 New contact form submission", { name, email, subject });

    // Send emails asynchronously
    // 1. Alert Admin
    sendContactFormAdminAlert(inquiry).catch(err => 
      logger.error("❌ Failed to send contact inquiry email to admin", { error: err.message })
    );

    // 2. Acknowledge Customer
    sendContactFormCustomerReply(inquiry).catch(err => 
      logger.error("❌ Failed to send contact acknowledgment email to customer", { error: err.message })
    );

    return res.status(200).json({
      success: true,
      message: "Thank you for contacting us. We have received your inquiry and will get back to you soon!"
    });
  } catch (error) {
    logger.error("Contact form error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to process your request. Please try again later."
    });
  }
};
