import { Document, Types } from "mongoose";

// User Type Interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isEmailVerified: boolean;

  avatarUrl?: {
    url: string;
    localPath?: string;
  };

  refreshToken?: string;

  forgetPasswordToken?: string;
  forgetPasswordTokenExpiry?: Date;

  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;

  createdAt?: Date;
  updatedAt?: Date;

  // instance methods
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateTemporaryToken(): {
    unHashedToken: string;
    hashedToken: string;
    tokenExpiry: number;
  };
}
