import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from "../dto/user.dto";
import { authRepository } from "../repository/auth.repository";
import { createModuleLogger } from "../config/logger";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { sanitizeUser } from "../utils/sanitizeUser";

const logger = createModuleLogger("auth.service");

export const authService = {
  // Register User
  register: async (data: RegisterDto) => {
    const { username, email, password } = data;

    logger.info({ username, email }, "Attempting user registration");

    const existing = await authRepository.findByEmailOrUsername(
      email,
      username
    );

    if (existing) {
      logger.warn({ username, email }, "User already exists");
      throw new Error("User already exists");
    }

    // Password will be hashed automatically by the User model's pre-save hook
    const user = await authRepository.createUser({
      username,
      email,
      password,
    });

    // Generate email verification token
    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    logger.info(
      { username },
      "User registered successfully with email verification token"
    );

    // TODO: Send email with unHashedToken
    // In production, you would send this via email service
    // For now, return it (ONLY FOR DEVELOPMENT/TESTING)
    return {
      user: sanitizeUser(user),
      verificationToken: unHashedToken, // Remove this in production
    };
  },

  // login User
  login: async (data: LoginDto) => {
    const { email, username, password } = data;

    logger.info({ email, username }, "Attempting user login");

    const user = await authRepository.findByEmailOrUsername(
      email ?? "",
      username ?? ""
    );

    if (!user) {
      logger.warn({ email, username }, "User not found");
      throw new Error("Invalid credentials");
    }

    const isValid = await user.isPasswordCorrect(password);

    if (!isValid) {
      logger.warn({ userId: user._id }, "Invalid password attempt");
      throw new Error("Invalid credentials");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await authRepository.updateRefreshToken(user._id.toString(), refreshToken);

    logger.info({ userId: user._id }, "User logged in successfully");

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  // Verify Email
  verifyEmail: async (token: string) => {
    if (!token) throw new ApiError(400, "Verification token missing");

    // Hash the incoming token so we can match it with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by hashed token + not expired
    const user = await authRepository.findByVerificationToken(hashedToken);
    if (!user) {
      logger.warn("Invalid or expired email verification token");
      throw new ApiError(400, "Invalid or expired verification token");
    }

    // Mark email verified & remove temp tokens
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return {
      isEmailVerified: true,
    };
  },

  // Logout User
  logout: async (userId: string) => {
    logger.info({ userId }, "Attempting user logout");
    await authRepository.clearRefreshToken(userId);
    logger.info({ userId }, "User logged out successfully");
    return true;
  },

  // Refresh Token
  refreshAccessToken: async (incomingRefreshToken: string) => {
    if (!incomingRefreshToken) {
      logger.warn("No refresh token provided");
      throw new ApiError(401, "Refresh token missing");
    }

    const user = await authRepository.findByRefreshToken(
      incomingRefreshToken ?? ""
    );
    if (!user) {
      logger.warn("Invalid refresh token");
      throw new ApiError(401, "Invalid refresh token");
    }

    let decoded: any;

    try {
      decoded = jwt.verify(
        incomingRefreshToken,
        env.JWT_REFRESH_TOKEN_SECRET as string
      );
    } catch (error) {
      logger.warn("Refresh token verification failed");
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.JWT_REFRESH_TOKEN_SECRET,
      { expiresIn: env.JWT_REFRESH_TOKEN_EXPIRY }
    );

    await authRepository.updateRefreshToken(
      user._id.toString(),
      newRefreshToken
    );
    logger.info({ userId: user._id }, "Access token refreshed successfully");

    return {
      user: sanitizeUser(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  forgotPassword: async (data: ForgotPasswordDto) => {
    logger.info({ email: data.email }, "Processing forgot password request");

    const user = await authRepository.forgetPassword(data.email);
    if (!user) {
      logger.warn({ email: data.email }, "User not found for password reset");
      // Don't throw error for security - don't reveal if email exists
      return { message: "If email exists, reset instructions have been sent" };
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.forgetPasswordToken = hashedToken;
    user.forgetPasswordTokenExpiry = new Date(tokenExpiry);
    await user.save({ validateBeforeSave: false });

    logger.info(
      { userId: user._id },
      "Password reset token generated successfully"
    );

    // TODO: Send email with unHashedToken
    // In production, you would send this via email service
    // For now, return it (ONLY FOR DEVELOPMENT/TESTING)
    return {
      message: "Password reset token generated",
      resetToken: unHashedToken, // Remove this in production
    };
  },

  resetForgottenPassword: async (data: ResetPasswordDto) => {
    logger.info("Processing password reset request");

    const { resetToken, newPassword } = data;

    if (!resetToken) throw new ApiError(400, "Reset token is missing");
    if (!newPassword || newPassword.length < 6)
      throw new ApiError(400, "New password must be at least 6 characters");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await authRepository.findByForgotPasswordToken(hashedToken);

    if (!user) {
      logger.warn("Invalid or expired password reset token");
      throw new ApiError(400, "Token is invalid or expired");
    }

    // Clear the reset tokens
    user.forgetPasswordToken = undefined;
    user.forgetPasswordTokenExpiry = undefined;

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;

    // Clear refresh token for security
    user.refreshToken = undefined;

    await user.save({ validateBeforeSave: false });

    logger.info({ userId: user._id }, "Password reset successfully");

    return { message: "Password reset successfully" };
  },

  changeCurrentPassword: async (
    userId: string,
    oldPassword: string,
    newPassword: string
  ) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const isValid = await user.isPasswordCorrect(oldPassword);
    if (!isValid) throw new ApiError(400, "Invalid old password");

    user.password = newPassword;

    user.refreshToken = undefined;

    await user.save({ validateBeforeSave: false });

    return { message: "Password changed successfully" };
  },
};
