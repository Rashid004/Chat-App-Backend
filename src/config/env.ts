import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const { createEnv } = require("@t3-oss/env-core");

export const env = createEnv({
  server: {
    // Environment
    NODE_ENV: z
      .enum(["development", "staging", "production"])
      .default("development"),

    // App
    PORT: z.coerce.number().default(3000),
    SERVICE_NAME: z.string().default("chat-backend"),

    // Logging
    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .default(process.env.NODE_ENV === "production" ? "warn" : "debug"),

    // MongoDB
    MONGODB_URI: z.string().url("Invalid MongoDB URI format"),

    // JWT
    JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().default("7d"),

    // CORS
    CORS_ORIGIN: z.string().optional(),
  },

  runtimeEnv: process.env,

  skipValidation: process.env.NODE_ENV === "test",

  onValidationError: (error: unknown) => {
    console.error("❌ Invalid environment variables:", error);
    throw new Error("Invalid environment variables");
  },

  onInvalidAccess: (variable: any) => {
    throw new Error(
      `❌ Attempted to access server-side environment variable: ${variable}`
    );
  },
});
