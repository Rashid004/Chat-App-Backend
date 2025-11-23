import mongoose from "mongoose";
import { createModuleLogger } from "./logger";
import { env } from "./env";

const logger = createModuleLogger("database");

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    logger.info(
      {
        environment: env.NODE_ENV,
        uri: env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"), // Mask credentials
      },
      "MongoDB connected successfully"
    );
  } catch (error) {
    logger.error({ error }, "MongoDB connection failed");
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("error", (error) => {
  logger.error({ error }, "MongoDB connection error");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error closing MongoDB connection");
    process.exit(1);
  }
});
