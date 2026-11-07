import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "./logger";

export async function connectDB(uri: string = config.mongoUrl): Promise<void> {
  await mongoose.connect(uri);
  logger.info({ database: mongoose.connection.name }, "Connected to MongoDB");
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info("Disconnected from MongoDB");
}
