import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(401).json({ message: "You are not logged in" });
  }

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, config.jwtPassword, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string" || !decoded.id) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.userId = String(decoded.id);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
