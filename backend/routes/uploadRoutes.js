import { Router } from "express";
import { uploadMultipleImages, uploadSingleImage } from "../controllers/uploadController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/", protect, adminOnly, uploadImage.single("image"), uploadSingleImage);
router.post("/multiple", protect, adminOnly, uploadImage.array("images", 10), uploadMultipleImages);

export default router;
