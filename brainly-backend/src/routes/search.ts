import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { ContentModel } from "../models/content";
import { escapeRegex } from "../utils";

export const searchRouter = Router();

searchRouter.get("/", requireAuth, async (req, res) => {
  const raw = typeof req.query.q === "string" ? req.query.q : "";
  const query = raw.trim().slice(0, 100);

  if (!query) {
    return res.status(400).json({
      message: "Query parameter 'q' is required",
    });
  }

  const regex = new RegExp(escapeRegex(query), "i");
  const userId = req.userId as string;

  const results = await ContentModel.find({
    userId,
    $or: [{ title: regex }, { link: regex }, { type: regex }],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("tags", "name");

  return res.json({ results });
});
