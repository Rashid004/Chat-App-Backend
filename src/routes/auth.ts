import { Router } from "express";
import {
  login,
  logout,
  refreshAccessToken,
  register,
  verifyEmail,
} from "../controller/authController";
import { verifyJWT } from "../middleware/verifyJWT";
import {
  authLimiter,
  loginLimiter,
  registrationLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();

router.post("/register", registrationLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", verifyJWT, authLimiter, logout);
router.get("/verify-email/:verificationToken", verifyEmail);

router.post("/refresh-token", refreshAccessToken);

export default router;
