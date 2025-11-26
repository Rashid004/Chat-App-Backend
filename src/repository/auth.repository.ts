import { UserModel } from "../models/User";
import { IUser } from "../types";
import { createModuleLogger } from "../config/logger";

const logger = createModuleLogger("auth.repository");

export const authRepository = {
  // --- Find user by email or username ---
  findByEmailOrUsername: async (email: string, username: string) => {
    logger.debug({ email, username }, "Finding user by email or username");
    const user = await UserModel.findOne({ $or: [{ email }, { username }] });
    logger.debug({ found: !!user }, "User search completed");
    return user;
  },

  // --- Create new user ---
  createUser: async (data: Partial<IUser>) => {
    logger.debug(
      { username: data.username, email: data.email },
      "Creating new user"
    );
    const user = await UserModel.create(data);
    logger.info({ userId: user._id }, "User created successfully");
    return user;
  },

  // --- Find user by ID ---
  findById: async (id: string) => {
    logger.debug({ userId: id }, "Finding user by ID");
    const user = await UserModel.findById(id);
    logger.debug({ found: !!user }, "User lookup completed");
    return user;
  },

  // --- Clear refresh token & update  ---
  clearRefreshToken: async (id: string) => {
    logger.debug({ userId: id }, "Clearing refresh token");
    const user = await UserModel.findByIdAndUpdate(
      id,
      { refreshToken: "" },
      { new: true }
    );
    logger.info({ userId: id }, "Refresh token cleared");
    return user;
  },

  // Find By refresh Token
  findByRefreshToken: async (token: string) => {
    logger.debug({ token }, "Finding user by refresh token");
    await UserModel.findOne({ refreshToken: token });
    logger.debug("User lookup by refresh token completed");
  },

  // --- Update refresh token ---
  updateRefreshToken: async (id: string, newToken: string) => {
    logger.debug({ userId: id }, "Updating refresh token");
    const user = await UserModel.findByIdAndUpdate(
      id,
      { refreshToken: newToken },
      { new: true }
    );
    logger.debug({ userId: id }, "Refresh token updated");
    return user;
  },
};
