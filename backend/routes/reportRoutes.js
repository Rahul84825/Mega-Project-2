import { Router } from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getAdminStats,
  getSalesReport,
  getCustomerReport,
  downloadSalesReport,
  downloadCustomerReport
} from "../controllers/reportController.js";

const router = Router();

// Stats for dashboard
router.get("/stats", protect, adminOnly, getAdminStats);

// Report data for tables/charts
router.get("/sales", protect, adminOnly, getSalesReport);
router.get("/customers", protect, adminOnly, getCustomerReport);

// Downloads
router.get("/sales/download", protect, adminOnly, downloadSalesReport);
router.get("/customers/download", protect, adminOnly, downloadCustomerReport);

export default router;
