import pino from "pino";
import { config } from "./config";

export const logger =
  config.nodeEnv === "development"
    ? pino({
        level: config.logLevel,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      })
    : pino({ level: config.logLevel });
