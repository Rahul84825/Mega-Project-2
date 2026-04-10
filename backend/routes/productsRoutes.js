import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct
} from "../controllers/productsController.js";
import { uploadImage } from "../middleware/uploadMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { productIdValidation, productValidation, updateProductValidation } from "../validators/index.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", productIdValidation, validateRequest, getProductById);
router.post("/", uploadImage.single("image"), productValidation, validateRequest, createProduct);
router.patch("/:id", productIdValidation, validateRequest, updateProductValidation, validateRequest, updateProduct);
router.delete("/:id", productIdValidation, validateRequest, deleteProduct);

export default router;
