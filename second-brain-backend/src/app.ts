import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "./logger";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { brainRouter } from "./routes/brain";
import { contentRouter } from "./routes/content";
import { profileRouter } from "./routes/profile";
import { searchRouter } from "./routes/search";
import { tagsRouter } from "./routes/tags";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());

  const allowedOrigins = new Set(config.corsOrigins);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        logger.warn({ origin }, "Blocked by CORS");
        return callback(null, false);
      },
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/health" },
    })
  );

  const skipRateLimit = () => config.rateLimitDisabled;

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
    message: { message: "Too many requests. Please try again later." },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
    message: { message: "Too many attempts. Please try again later." },
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.use("/api/v1", globalLimiter);
  app.use("/api/v1/signup", authLimiter);
  app.use("/api/v1/signin", authLimiter);
  app.use("/api/v1/profile/password", authLimiter);
  app.delete("/api/v1/profile", authLimiter);

  app.use("/api/v1", authRouter);
  app.use("/api/v1/content", contentRouter);
  app.use("/api/v1/brain", brainRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use("/api/v1/search", searchRouter);
  app.use("/api/v1/tags", tagsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
