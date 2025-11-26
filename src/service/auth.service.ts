import { LoginDto, RegisterDto } from "../dto/user.dto";
import { authRepository } from "../repository/auth.repository";
import { createModuleLogger } from "../config/logger";

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
};
