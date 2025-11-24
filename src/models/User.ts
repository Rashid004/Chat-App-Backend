import { model, Schema, Types } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

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

const userSchema = new Schema<IUser>(
  {
    avatarUrl: {
      url: { type: String, default: "https://via.placeholder.com/200x200.png" },
      localPath: { type: String, default: "" },
    },

    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      enum: ["user", "admin"],
      type: String,
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: String,

    forgetPasswordToken: String,
    forgetPasswordTokenExpiry: Date,

    emailVerificationToken: String,
    emailVerificationTokenExpiry: Date,
  },
  { timestamps: true }
);

/* ------------------------ Password Hashing ------------------------ */

userSchema.pre("save", async function (next) {
  // @ts-ignore
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  // @ts-ignore
  next();
});

/* ------------------------ Instance Methods ------------------------ */
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { userId: this._id, role: this.role },
    env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      role: this.role,
    },
    env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: env.JWT_REFRESH_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes

  return { unHashedToken, hashedToken, tokenExpiry };
};

export const UserModel = model<IUser>("User", userSchema);
