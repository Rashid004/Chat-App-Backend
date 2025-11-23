import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { httpLogger } from "./config/logger";
import helmet from "helmet";
import { env } from "./config/env";
import { connectDB } from "./config/database";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(httpLogger);

// security
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

connectDB();

export default app;
