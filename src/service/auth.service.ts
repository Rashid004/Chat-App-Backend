import { LoginDto, RegisterDto } from "../dto/user.dto";
import { authRepository } from "../repository/auth.repository";
import { createModuleLogger } from "../config/logger";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

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

    logger.info({ userId: user._id, username }, "User registered successfully");
    return user;
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
      user,
      accessToken,
      refreshToken,
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
      logger.warn("Refresh token verification failed", { error });
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = jwt.sign(
      { userId: user._id },
      env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY }
    );

    await authRepository.updateRefreshToken(
      user._id.toString(),
      incomingRefreshToken
    );
    logger.info({ userId: user._id }, "Access token refreshed successfully");

    return {
      accessToken: newAccessToken,
      refreshToken: incomingRefreshToken,
    };
  },
};
