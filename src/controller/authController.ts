import { Request, Response } from "express";
import { loginDto, registerDto } from "../dto/user.dto";
import { authService } from "../service/auth.service";
import { createModuleLogger } from "../config/logger";
import { ZodError } from "zod";
import { env } from "../config/env";
import { ApiResponse } from "../utils/api-response";

const logger = createModuleLogger("auth.controller");

export const register = async (req: Request, res: Response) => {
  try {
    logger.debug({ body: req.body }, "Received registration request");
    const body = registerDto.parse(req.body);
    const user = await authService.register(body);

    logger.info({ userId: user._id }, "User registration successful");

    return res.status(201).json({
      success: true,
      data: { user },
      message: "User registered successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn(
        { errors: error.issues },
        "Validation error during registration"
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }

    logger.error(
      {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "Registration failed"
    );

    const message =
      error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

// ----- Login User -----
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
      .json({
        success: true,
        data: { user, accessToken, refreshToken },
        message: "User logged in successfully",
      });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn({ errors: error.issues }, "Validation error during login");
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.issues,
      });
    }
    logger.error({ error }, "Login failed");
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

// ----- verify Email -----
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { verificationToken } = req.params;

    if (!verificationToken) {
      logger.warn("Verification token missing in request");
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const result = await authService.verifyEmail(verificationToken);

    logger.info("Email verified successfully");
    return res.status(200).json({
      success: true,
      data: result,
      message: "Email verified successfully",
    });
  } catch (error) {
    logger.error({ error }, "Email verification failed");
    const message =
      error instanceof Error ? error.message : "Email verification failed";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

// ----- Logout User -----
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id.toString();

    if (!userId) {
      logger.warn("Logout attempted without user context");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await authService.logout(userId);

    logger.info({ userId }, "User logout successful");

    return res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .status(200)
      .json({
        success: true,
        data: null,
        message: "User logged out successfully",
      });
  } catch (error) {
    logger.error({ error }, "Logout failed");
    const message = error instanceof Error ? error.message : "Logout failed";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

// ----- Refresh Access Token -----
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      logger.warn("Refresh token missing in request");
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
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
      .json({
        success: true,
        data: { user, accessToken, refreshToken },
        message: "Access token refreshed successfully",
      });
  } catch (error) {
    logger.error({ error }, "Token refresh failed");
    const message =
      error instanceof Error ? error.message : "Token refresh failed";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};

// ----- Forget Password -----
export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    logger.info({ email }, "Forgot password process initiated");
    return res.status(200).json({
      success: true,
      message: "Password reset instructions sent to email if it exists",
    });
  } catch (error) {}
};

// ------ Reset Password -------
export const resetPassword = async (req: Request, res: Response) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body as { newPassword: string };
  const result = await authService.resetForgottenPassword(
    resetToken,
    newPassword
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Password reset successfully"));
};

// ------- Change Password --------

export const changePassword = async (req: Request, res: Response) => {
  userId = req.user;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { oldPassword, newPassword } = req.body;

  const result = await authService.changeCurrentPassword(
    userId.toString(),
    oldPassword,
    newPassword
  );
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Password changed successfully"));
};
