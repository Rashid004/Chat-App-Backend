import { Request, Response } from "express";
import { loginDto, registerDto } from "../dto/user.dto";
import { authService } from "../service/auth.service";
import { createModuleLogger } from "../config/logger";
import { ZodError } from "zod";

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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
