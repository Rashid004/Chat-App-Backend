import { env } from "../config/env";
import { createModuleLogger } from "../config/logger";
import rateLimit from "express-rate-limit";

const logger = createModuleLogger("rateLimiter");

// Handler for rate limit exceeded
const createRateLimitHandler = (identifier: string) => (req: any, res: any) => {
  logger.warn(
    {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      method: req.method,
      identifier,
    },
    `Rate limit exceeded for ${identifier}`
  );
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later.",
    retryAfter: Math.round(req.rateLimit.resetTime / 1000),
  });
};

// General API rate limiter

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "development" ? 1000 : 100, // limit each IP to 100 requests per windowMs in production, 1000 in development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("API"),

  skip: (req) => {
    return req.path.startsWith("/health");
  },
});

// Authentication rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "development" ? 50 : 5, // limit each IP to 10 requests per windowMs in production, 3 in development
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Auth"),
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === "development" ? 10 : 3, // limit each IP to 5 requests per windowMs in production, 2 in development
  message: "Too many password reset attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Password Reset"),
});

// Registration rate limiter
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === "development" ? 20 : 4, // limit each IP to 10 requests per windowMs in production, 3 in development
  message: "Too many registration attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Registration"),
});

// Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "development" ? 20 : 5, // limit each IP to 10 requests per windowMs in production, 3 in development
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Login"),
});

// Create Custom rate limiter
export const createCustomRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  identifier: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || "Rate limit exceeded",
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler(options.identifier),
  });
};
