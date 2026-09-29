import { createApp } from "./app";
import { config } from "./config";
import { connectDB, disconnectDB } from "./db";
import { logger } from "./logger";

async function main() {
  await connectDB();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv },
      "Brainly API listening"
    );
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, "Shutting down gracefully");

    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });

    // Force-exit if connections do not drain in time
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
