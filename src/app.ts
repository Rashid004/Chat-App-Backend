import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { httpLogger } from "./config/logger";
import helmet from "helmet";
import { env } from "./config/env";
import { connectDB } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chats";

const app = express();

// CORS must come before helmet for proper preflight handling
app.use(
  cors({
    origin: env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Apply global API rate limiter
app.use(apiLimiter);

// Security (helmet) - adjust for development
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(httpLogger);

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
