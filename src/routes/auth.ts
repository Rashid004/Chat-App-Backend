import { Router } from "express";
import {
  changePassword,
  forgetPassword,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
  verifyEmail,
} from "../controller/authController";
import { verifyJWT } from "../middleware/verifyJWT";
import {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  registrationLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();

// Public routes
router.post("/register", registrationLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/forgot-password", passwordResetLimiter, forgetPassword);
router.post("/reset-password/:resetToken", passwordResetLimiter, resetPassword);
router.post("/refresh-token", refreshAccessToken);

// Protected routes (require authentication)
router.post("/logout", verifyJWT, authLimiter, logout);
router.post("/change-password", verifyJWT, authLimiter, changePassword);

export default router;
