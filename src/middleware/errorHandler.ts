import { NextFunction, Request, Response } from "express";
import { createModuleLogger } from "../config/logger";
import { ZodError } from "zod";

const logger = createModuleLogger("errorHandler");

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    },
    "Unhandled error"
  );

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.issues,
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = error.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.warn({ path: req.path, method: req.method }, "Route not found");
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
