import http from "http";
import app from "./app";
import { Server } from "socket.io";
import { env } from "./config/env";
import { logger } from "./config/logger";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// setup socket.io(empty for now)

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
});

io.on("connection", () => {
  console.log("Socket connected");
});

server.listen(PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
      logLevel: env.LOG_LEVEL,
      healthCheck: `http://localhost:${env.PORT}/health`,
    },
    "Server started successfully"
  );
});
