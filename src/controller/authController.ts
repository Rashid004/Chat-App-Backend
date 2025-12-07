import { Request, Response } from "express";
import { loginDto, registerDto } from "../dto/user.dto";
import { authService } from "../service/auth.service";
import { createModuleLogger } from "../config/logger";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiResponse } from "../utils/api-response";
import { ApiError } from "../utils/api-error";

const logger = createModuleLogger("auth.controller");

// ===== Helper function to handle errors =====
const handleError = (
  error: unknown,
  res: Response,
  defaultMessage: string,
  defaultStatus: number = 400
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
  }

  if (error instanceof ZodError) {
    logger.warn({ errors: error.issues }, "Validation error");
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.issues,
    });
  }

  const message = error instanceof Error ? error.message : defaultMessage;
  return res.status(defaultStatus).json({
    success: false,
    message,
  });
};

// ===== Register User =====
export const register = async (req: Request, res: Response) => {
  try {
    logger.debug({ body: req.body }, "Received registration request");
    const body = registerDto.parse(req.body);
    const result = await authService.register(body);

    logger.info({ userId: result.user?._id }, "User registration successful");
    return res
      .status(201)
      .json(new ApiResponse(201, result, "User registered successfully"));
  } catch (error) {
    logger.error({ error }, "Registration failed");
    return handleError(error, res, "Registration failed");
  }
};

// ===== Login User =====
export const login = async (req: Request, res: Response) => {
  try {
    const body = loginDto.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(body);

    logger.info({ userId: user._id }, "User login successful");

    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    logger.error({ error }, "Login failed");
    return handleError(error, res, "Login failed", 401);
  }
};

// ===== Verify Email =====
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { verificationToken } = req.params;

    if (!verificationToken) {
      logger.warn("Verification token missing in request");
      throw new ApiError(400, "Verification token is required");
    }

    const result = await authService.verifyEmail(verificationToken);

    logger.info("Email verified successfully");
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Email verified successfully"));
  } catch (error) {
    logger.error({ error }, "Email verification failed");
    return handleError(error, res, "Email verification failed");
  }
};

// ===== Logout User =====
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      logger.warn("Logout attempted without user context");
      throw new ApiError(401, "Unauthorized");
    }

    await authService.logout(userId.toString());

    logger.info({ userId }, "User logout successful");

    return res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    logger.error({ error }, "Logout failed");
    return handleError(error, res, "Logout failed", 500);
  }
};

// ===== Refresh Access Token =====
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      logger.warn("Refresh token missing in request");
      throw new ApiError(401, "Refresh token is required");
    }

    const { accessToken, refreshToken, user } =
      await authService.refreshAccessToken(incomingRefreshToken);

    logger.info({ userId: user._id }, "Access token refreshed successfully");

    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user, accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    logger.error({ error }, "Token refresh failed");
    return handleError(error, res, "Token refresh failed", 401);
  }
};

// ===== Forgot Password =====
export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.warn("Email missing in forgot password request");
      throw new ApiError(400, "Email is required");
    }

    const result = await authService.forgotPassword({ email });
    logger.info({ email }, "Forgot password process initiated");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Password reset instructions sent to email if it exists"
        )
      );
  } catch (error) {
    logger.error({ error }, "Forgot password failed");
    return handleError(error, res, "Forgot password failed");
  }
};

// ===== Reset Password =====
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!resetToken) {
      logger.warn("Reset token missing in request");
      throw new ApiError(400, "Reset token is required");
    }

    if (!newPassword) {
      logger.warn("New password missing in request");
      throw new ApiError(400, "New password is required");
    }

    const result = await authService.resetForgottenPassword({
      resetToken,
      newPassword,
    });

    logger.info("Password reset successfully");
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Password reset successfully"));
  } catch (error) {
    logger.error({ error }, "Password reset failed");
    return handleError(error, res, "Password reset failed");
  }
};

// ===== Change Password =====
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      logger.warn("Unauthorized change password attempt");
      throw new ApiError(401, "Unauthorized");
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      logger.warn("Missing passwords in change password request");
      throw new ApiError(400, "Old password and new password are required");
    }

    const result = await authService.changeCurrentPassword(
      userId.toString(),
      oldPassword,
      newPassword
    );

    logger.info({ userId }, "Password changed successfully");
    return res
      .status(200)
      .json(new ApiResponse(200, result, "Password changed successfully"));
  } catch (error) {
    logger.error({ error }, "Password change failed");
    return handleError(error, res, "Password change failed");
  }
};
