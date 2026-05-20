import { Router } from "express";
import { handleContactForm } from "../controllers/contactController.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Strict rate limit for contact form (prevent spam)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 messages per hour per IP
  message: "Too many messages from this IP, please try again after an hour"
});

router.post("/", contactLimiter, handleContactForm);

export default router;
