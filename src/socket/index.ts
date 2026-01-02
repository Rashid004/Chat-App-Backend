import http from "http";
import { Server } from "socket.io";
import { logger } from "../config/logger";
import { setupSocketAuth } from "./auth";

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  // Middleware to setup socket authentication
  io.use(setupSocketAuth);

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.user._id);

    logger.info(`User connected: ${socket.user._id}`);

    registerChatEvents(io, socket);

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.user._id);
      logger.info(`User disconnected: ${socket.user._id}`);
    });
  });

  return io;
};
