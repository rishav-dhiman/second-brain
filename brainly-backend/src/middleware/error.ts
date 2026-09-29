import type { NextFunction, Request, Response } from "express";
import { logger } from "../logger";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let status = 500;
  let message = "Internal server error";

  if (err && typeof err === "object") {
    const candidate = err as {
      status?: unknown;
      statusCode?: unknown;
      message?: unknown;
      type?: unknown;
      name?: unknown;
    };

    const rawStatus =
      typeof candidate.status === "number"
        ? candidate.status
        : typeof candidate.statusCode === "number"
          ? candidate.statusCode
          : 500;

    if (rawStatus >= 400 && rawStatus < 600) {
      status = rawStatus;
    }

    if (
      status < 500 &&
      typeof candidate.message === "string" &&
      candidate.message
    ) {
      message = candidate.message;
    }

    if (candidate.type === "entity.parse.failed") {
      status = 400;
      message = "Invalid JSON body";
    }

    if (candidate.name === "CastError") {
      status = 400;
      message = "Invalid id format";
    }
  }

  if (status >= 500) {
    logger.error({ err }, "Unhandled server error");
  }

  res.status(status).json({ message });
}
