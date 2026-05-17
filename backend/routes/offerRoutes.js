import { Router } from "express";
import {
  createOffer,
  deleteOffer,
  getOffers,
  toggleOffer,
  updateOffer
} from "../controllers/offerController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { param, body } from "express-validator";

const offerIdValidation = [
  param("id").trim().isLength({ min: 1, max: 64 }).withMessage("Invalid offer id")
];

const offerBodyValidation = [
  body("title").optional().trim().isLength({ min: 1, max: 120 }).withMessage("Title is required")
];

const router = Router();

router.get("/", getOffers);
router.post("/", protect, adminOnly, offerBodyValidation, validateRequest, createOffer);
router.put("/:id", protect, adminOnly, offerIdValidation, validateRequest, offerBodyValidation, validateRequest, updateOffer);
router.patch("/:id", protect, adminOnly, offerIdValidation, validateRequest, offerBodyValidation, validateRequest, updateOffer);
router.patch("/:id/toggle", protect, adminOnly, offerIdValidation, validateRequest, toggleOffer);
router.delete("/:id", protect, adminOnly, offerIdValidation, validateRequest, deleteOffer);

export default router;