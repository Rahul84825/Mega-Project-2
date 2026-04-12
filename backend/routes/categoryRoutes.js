import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from "../controllers/categoryController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { categoryCreateValidation, categoryIdValidation, categoryUpdateValidation } from "../validators/index.js";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, adminOnly, categoryCreateValidation, validateRequest, createCategory);
router.put("/:id", protect, adminOnly, categoryIdValidation, validateRequest, categoryUpdateValidation, validateRequest, updateCategory);
router.patch("/:id", protect, adminOnly, categoryIdValidation, validateRequest, categoryUpdateValidation, validateRequest, updateCategory);
router.delete("/:id", protect, adminOnly, categoryIdValidation, validateRequest, deleteCategory);

export default router;
