import { Router } from "express";
import {
  createHeroSlide,
  deleteHeroSlide,
  getHeroSlides,
  getHeroSlidesAdmin,
  updateHeroSlide
} from "../controllers/heroSlideController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";

const router = Router();

router.get("/", getHeroSlides);
router.get("/admin", protect, adminOnly, getHeroSlidesAdmin);
router.post("/", protect, adminOnly, uploadImage.single("image"), createHeroSlide);
router.patch("/:id", protect, adminOnly, uploadImage.single("image"), updateHeroSlide);
router.delete("/:id", protect, adminOnly, deleteHeroSlide);

export default router;
