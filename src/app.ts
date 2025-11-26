import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { httpLogger } from "./config/logger";
import helmet from "helmet";
import { env } from "./config/env";
import { connectDB } from "./config/database";
import authRoutes from "./routes/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";

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

apiLimiter();

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

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
