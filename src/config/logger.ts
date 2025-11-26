// src/config/logger.ts
import pino from "pino";
import pinoHttp from "pino-http";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: env.LOG_LEVEL || "info",

  // pretty logs only during development
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  // Production-safe config
  ...(!isDev && {
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.token",
        "*.secret",
      ],
      remove: true,
    },
  }),

  base: {
    service: env.SERVICE_NAME || "my-backend",
    env: env.NODE_ENV,
  },
});

// Create child loggers for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

/**
 * EXPRESS HTTP LOGGER
 * Usage: app.use(httpLogger)
 */
export const httpLogger = pinoHttp({
  logger,

  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,

  customErrorMessage: (req, _res, err) =>
    `${req.method} ${req.url} FAILED: ${err?.message || ""}`,

  // Customize serializers to reduce log verbosity
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Only log important headers
      headers: {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
