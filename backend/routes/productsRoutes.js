import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
  getStockInfo,
  toggleProductStatus,
  toggleVariantStatus
} from "../controllers/productsController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { productIdValidation, productValidation, updateProductValidation } from "../validators/index.js";

const router = Router();

router.get("/", getProducts);
router.get("/stock/info", getStockInfo); // Get stock info before /products/:id
router.patch("/:id/toggle-status", protect, adminOnly, toggleProductStatus);
router.patch("/:id/variants/:variantId/toggle-status", protect, adminOnly, toggleVariantStatus);
router.get("/:id", productIdValidation, validateRequest, getProductById);
router.post("/", protect, adminOnly, uploadImage.single("image"), productValidation, validateRequest, createProduct);
router.put("/:id", protect, adminOnly, productIdValidation, validateRequest, updateProductValidation, validateRequest, updateProduct);
router.patch("/:id", protect, adminOnly, productIdValidation, validateRequest, updateProductValidation, validateRequest, updateProduct);
router.delete("/:id", protect, adminOnly, productIdValidation, validateRequest, deleteProduct);

export default router;
