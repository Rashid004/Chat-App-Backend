import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { authRepository } from "../repository/auth.repository";
import { createModuleLogger } from "../config/logger";

const logger = createModuleLogger("verifyJWT");

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      logger.warn("Missing access token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET) as {
      userId: string;
    };

    const user = await authRepository.findById(decoded.userId);

    if (!user) {
      logger.warn({ userId: decoded.userId }, "User not found for token");
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = user;
    logger.debug({ userId: user._id }, "User authenticated successfully");
    next();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid token";
    logger.error({ error }, "JWT verification failed");
    return res.status(401).json({
      success: false,
      message: errorMessage,
    });
  }
};
