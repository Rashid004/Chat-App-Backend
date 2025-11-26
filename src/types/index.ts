import { Types } from "mongoose";

export interface IUser {
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

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
