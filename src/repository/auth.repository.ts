import { UserModel } from "../models/User";
import { IUser } from "../types";
import { createModuleLogger } from "../config/logger";
import { Types } from "mongoose";

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

  // Find By verification Token
  findByVerificationToken: async (hashedToken: string) => {
    logger.debug({ hashedToken }, "Finding user by verification token");
    const user = await UserModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });
    logger.debug(
      { found: !!user },
      "User lookup by verification token completed"
    );
    return user;
  },

  // Forget Password
  forgetPassword: async (email: string) => {
    logger.debug({ email }, "Finding user by email for password reset");
    const user = await UserModel.findOne({ email });
    logger.debug("User lookup for password reset completed");
    return user;
  },

  saveForgotPasswordToken: async (
    userId: string | Types.ObjectId,
    hashedToken: string,
    expiry: number
  ) => {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: new Date(expiry),
      },
      { new: true }
    );
  },

  findByForgotPasswordToken: async (hashedToken: string) => {
    return UserModel.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });
  },

  clearForgotPasswordToken: async (userId: string | Types.ObjectId) => {
    return UserModel.findByIdAndUpdate(
      userId,
      { $unset: { forgotPasswordToken: "", forgotPasswordExpiry: "" } },
      { new: true }
    );
  },

  // Find By refresh Token
  findByRefreshToken: async (token: string) => {
    logger.debug({ token }, "Finding user by refresh token");
    const user = await UserModel.findOne({ refreshToken: token });
    logger.debug({ found: !!user }, "User lookup by refresh token completed");
    return user;
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
