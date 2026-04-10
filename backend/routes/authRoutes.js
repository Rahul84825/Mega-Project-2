import { Router } from "express";
import { googleLogin, loginUser, registerUser } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { googleAuthValidation, loginValidation, registerValidation } from "../validators/index.js";

const router = Router();

router.post("/register", authLimiter, registerValidation, validateRequest, registerUser);
router.post("/login", authLimiter, loginValidation, validateRequest, loginUser);
router.post("/google", authLimiter, googleAuthValidation, validateRequest, googleLogin);

export default router;
