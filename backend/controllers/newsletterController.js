import Newsletter from "../models/Newsletter.js";
import { logger } from "../utils/logger.js";

export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ success: false, message: "You are already subscribed!" });
      } else {
        // Re-activate if previously unsubscribed
        existing.isActive = true;
        await existing.save();
        return res.status(200).json({ success: true, message: "Subscription re-activated!" });
      }
    }

    await Newsletter.create({ email });

    logger.info(`📧 New newsletter subscription: ${email}`);

    return res.status(201).json({
      success: true,
      message: "Thank you for joining our Festive Club!"
    });
  } catch (error) {
    logger.error("Newsletter subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to subscribe. Please try again later."
    });
  }
};
